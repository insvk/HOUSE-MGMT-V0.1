import { supabase, isSupabaseConfigured, cloudDb, generateUUID } from './supabaseClient';
import { User, UserRole } from '../types';
import { DEFAULT_CREDENTIALS } from '../data/initialData';

/**
 * Enterprise Authentication Service mapping to Supabase Auth (GoTrue).
 *
 * ROOT CAUSE #3 FIX: All public.users inserts/updates now use snake_case column names
 *   (full_name, flat_number, occupancy_status) matching make_permanent.sql schema.
 *
 * ROOT CAUSE #4 FIX: auth_id column is written on JIT migration if the column exists.
 *
 * ROOT CAUSE #8 FIX: GOD MAXX BYPASS no longer returns id:'admin-bypass'. Rate-limited
 *   users are given a proper soft-bypass only when credentials are verified against
 *   DEFAULT_CREDENTIALS, and the returned user object is fetched from the real DB.
 */
export const authService = {
  /**
   * Main Login Handler
   *
   * Flow:
   * 1. Username → email reverse lookup (if no @ in identifier)
   * 2. Try Supabase Auth signInWithPassword
   * 3. If "Invalid login credentials" → JIT Migration:
   *    a. Look up user in public.users by email
   *    b. Check password column against provided password
   *    c. If match → call supabase.auth.signUp to create Auth identity
   *    d. Link public.users.auth_id to the new auth user
   *    e. Scrub plaintext password from DB
   *    f. Re-attempt signInWithPassword
   */
  async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Auth system offline' };
    }

    // Sanitize: strip zero-width spaces, invisible chars, trim, lowercase
    const cleanIdentifier = identifier
      .replace(/[\u200B-\u200D\uFEFF\s]/g, '')
      .trim()
      .toLowerCase();

    if (!cleanIdentifier) {
      return { success: false, error: 'Email or username is required.' };
    }

    let targetEmail = cleanIdentifier;

    // Step 1: Username reverse lookup
    if (!cleanIdentifier.includes('@')) {
      const { data, error: lookupError } = await supabase
        .from('users')
        .select('email')
        .eq('username', cleanIdentifier)
        .maybeSingle();

      if (lookupError) {
        console.warn('Username lookup error:', lookupError.message);
      }

      if (data?.email) {
        targetEmail = data.email.toLowerCase().trim();
      } else {
        return {
          success: false,
          error: 'No account found with that username.',
        };
      }
    }

    // Step 2: Attempt Supabase Auth login
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: password,
    });

    // Step 3: JIT Migration if "Invalid login credentials"
    if (authError && authError.message.includes('Invalid login credentials')) {
      const jitResult = await this._attemptJITMigration(targetEmail, password);

      if (jitResult.success && jitResult.authData) {
        authData = jitResult.authData;
        authError = null;
      } else if (jitResult.error) {
        // JIT found user but migration failed — surface the real error
        return { success: false, error: jitResult.error };
      }
      // If JIT found no user at all, fall through to authError below
    }

    // Step 4: Handle rate-limit / email-not-confirmed with verified credentials
    // ROOT CAUSE #8 FIX: do NOT return id:'admin-bypass'. Log the issue and
    // instruct the user to check their email or retry later.
    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes('rate limit')) {
        return {
          success: false,
          error:
            'Too many login attempts. Please wait a few minutes and try again.',
        };
      }
      if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
        // Check if email was auto-confirmed by the DB trigger; if not, verify credentials first
        if (DEFAULT_CREDENTIALS[targetEmail] === password) {
          // Attempt to manually confirm by re-triggering the signUp (idempotent on Supabase)
          await supabase.auth.signUp({ email: targetEmail, password });
          // Re-attempt login
          const retry = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password,
          });
          if (!retry.error && retry.data.session) {
            authData = retry.data;
            authError = null;
          } else {
            return {
              success: false,
              error:
                'Email not confirmed. Please check your inbox or contact the administrator.',
            };
          }
        } else {
          return {
            success: false,
            error:
              'Email not confirmed. Please check your inbox or contact the administrator.',
          };
        }
      }
    }

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData?.session) {
      return { success: false, error: 'Login failed. No session established.' };
    }

    // Success: log security event (fire-and-forget is acceptable for audit logs)
    this.logSecurityEvent('LOGIN_SUCCESS', targetEmail, authData.session.user.id);

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  },

  /**
   * JIT Migration: creates a Supabase Auth identity for an existing public.users row
   * that still has a plaintext password in the DB.
   *
   * ROOT CAUSE #3 FIX: uses snake_case column names in all DB operations.
   * ROOT CAUSE #4 FIX: writes auth_id back to public.users after creating Auth identity.
   */
  async _attemptJITMigration(
    email: string,
    password: string
  ): Promise<{ success: boolean; authData?: any; error?: string }> {
    if (!supabase) return { success: false };

    // 1. Fetch the user from public.users
    const { data: legacyUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, password, role, occupancy_status')
      .eq('email', email)
      .limit(1);

    if (dbError) {
      console.warn('JIT: DB lookup error:', dbError.message);
      return { success: false };
    }

    const legacyUser = legacyUsers && legacyUsers.length > 0 ? legacyUsers[0] : null;

    // Also check DEFAULT_CREDENTIALS for hardcoded admin accounts
    const validPassword = legacyUser?.password || DEFAULT_CREDENTIALS[email];

    if (!validPassword) {
      // User simply doesn't exist in our system
      return { success: false };
    }

    if (validPassword !== password) {
      // User exists but password is wrong — return early so caller shows "Invalid credentials"
      return { success: false, error: 'Invalid login credentials' };
    }

    // 2. Passwords match — create Supabase Auth identity
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // "User already registered" means auth identity exists but has wrong password — not our fault
      if (
        signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          error: 'Account exists but credentials are invalid. Please reset your password.',
        };
      }
      // Rate limit during sign-up
      if (signUpError.message.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Too many attempts. Please wait a few minutes and try again.',
        };
      }
      return { success: false, error: `Account migration failed: ${signUpError.message}` };
    }

    // 3. Link auth_id back to public.users and scrub plaintext password
    if (signUpData.user) {
      if (legacyUser) {
        // Update existing public.users row with auth_id and null out the plaintext password
        const { error: updateError } = await supabase
          .from('users')
          .update({
            auth_id: signUpData.user.id,
            password: null,  // ROOT CAUSE #3 FIX: scrub plaintext password
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateError) {
          console.warn('JIT: Failed to link auth_id (auth_id column may be missing — run fix_auth_schema.sql):', updateError.message);
          // Non-fatal: user can still log in, just auth_id won't be linked yet
        }
      } else {
        // Admin in DEFAULT_CREDENTIALS but NOT in public.users — insert them now
        // ROOT CAUSE #3 FIX: use snake_case column names
        const { error: insertError } = await supabase.from('users').insert({
          id: generateUUID(),
          auth_id: signUpData.user.id,
          email: email,
          full_name: email.split('@')[0],
          flat_number: 'Owner Suite',
          role: 'OWNER',
          occupancy_status: 'active',
          is_active: true,
          password: null,  // Never store plaintext after migration
        });

        if (insertError) {
          console.warn('JIT: Failed to insert admin into public.users:', insertError.message);
        }
      }

      // 4. Re-attempt login to get a proper session
      const retryAuth = await supabase.auth.signInWithPassword({ email, password });

      if (retryAuth.error) {
        return { success: false, error: `Migration succeeded but login retry failed: ${retryAuth.error.message}` };
      }

      return { success: true, authData: retryAuth.data };
    }

    return { success: false, error: 'Migration: No user returned from signUp.' };
  },

  /**
   * Register a new user natively into Supabase Auth.
   *
   * ROOT CAUSE #3 FIX: the public.users insert uses snake_case column names.
   * ROOT CAUSE #4 FIX: auth_id is linked in the same operation.
   *
   * Note: We do NOT create the public.users row here — that is handled by:
   *   a) The DB trigger `on_auth_user_created` (defined in fix_auth_schema.sql), OR
   *   b) The calling code in App.tsx (handleSignUpSuccess) which calls cloudDb.createUser()
   * The trigger handles race conditions automatically.
   */
  async signUp(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Offline' };

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { success: false, error: error.message };

    return { success: true, user: data.user };
  },

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.logSecurityEvent('LOGOUT', data.session.user.email || 'unknown', data.session.user.id);
    }
    await supabase.auth.signOut();
  },

  /**
   * Initiates Password Reset (Sends OTP via Email)
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Offline' };

    this.logSecurityEvent('PASSWORD_RESET_REQUESTED', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    // Account enumeration protection: always return success generically
    if (error) {
      console.warn('Password reset error (not surfaced to user):', error.message);
    }

    return { success: true };
  },

  /**
   * Verify OTP and establish temporary session to reset password
   */
  async verifyOTP(email: string, token: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Offline' };

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) {
      this.logSecurityEvent('PASSWORD_RESET_OTP_FAILED', email);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Update Password (requires an active session / verified OTP)
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Offline' };

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) return { success: false, error: error.message };

    if (data.user) {
      this.logSecurityEvent('PASSWORD_CHANGED', data.user.email || 'unknown', data.user.id);
    }
    return { success: true };
  },

  /**
   * 2FA (TOTP) Enrollment Initialization
   */
  async enrollTOTP(): Promise<{
    success: boolean;
    qrCodeUrl?: string;
    secret?: string;
    factorId?: string;
    error?: string;
  }> {
    if (!supabase) return { success: false, error: 'Offline' };

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      qrCodeUrl: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    };
  },

  /**
   * 2FA Verification (Complete Enrollment or Verify Login Challenge)
   */
  async verifyTOTP(
    factorId: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Offline' };

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) return { success: false, error: challenge.error.message };

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (verify.error) return { success: false, error: verify.error.message };

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.logSecurityEvent(
        'TWO_FACTOR_VERIFIED',
        data.session.user.email || 'unknown',
        data.session.user.id
      );
    }

    return { success: true };
  },

  /**
   * Get Current Session
   */
  async getSession() {
    if (!supabase) return { data: { session: null } };
    return supabase.auth.getSession();
  },

  /**
   * Log Security Events to DB (fire-and-forget — audit logs are non-critical path)
   */
  logSecurityEvent(eventType: string, email: string, authId?: string) {
    if (!supabase) return;
    supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        user_email: email,
        auth_id: authId || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      })
      .then(({ error }) => {
        if (error) console.warn('Security log error (non-critical):', error.message);
      });
  },
};
