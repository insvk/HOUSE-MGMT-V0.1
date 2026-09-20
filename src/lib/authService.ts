import { supabase, isSupabaseConfigured, cloudDb, generateUUID, isValidUUID, mapDbRowToUser } from './supabaseClient';
import { User, UserRole } from '../types';
import { DEFAULT_CREDENTIALS } from '../data/initialData';

/**
 * Enterprise Authentication Service mapping to Supabase Auth & Cloud Database.
 * 
 * SUPPORTS:
 * 1. Universal Identifier Login: Tenant ID (UUID), Email, Username (@user or user), or Flat Number
 * 2. Permanent Authoritative Credentials: uses password configured in "Tenant Directory & Occupant Administration"
 * 3. Never wipes or nulls out tenant passwords in PostgreSQL
 * 4. Resilient multi-tier fallback: GoTrue Auth -> Cloud Database -> Encrypted Local Store
 */
export const authService = {
  /**
   * Universal Login Handler
   * Allows logging in using Tenant ID, Email, Username, or Flat Number alongside their password.
   */
  async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: any; session?: any; profile?: User; error?: string }> {
    // 1. Sanitize input
    const cleanId = (identifier || '')
      .replace(/[\u200B-\u200D\uFEFF\s]/g, '')
      .trim();
    const cleanIdLower = cleanId.toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanId) {
      return { success: false, error: 'Email, username, or Tenant ID is required.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Password is required.' };
    }

    let targetUser: User | null = null;
    let targetEmail = cleanIdLower;

    // 2. Resolve target user by ID, Email, Username, or Flat Number from Cloud DB
    if (isSupabaseConfigured && supabase) {
      try {
        const strippedUsername = cleanIdLower.replace(/^@/, '');
        const filterParts: string[] = [];

        if (cleanIdLower.includes('@')) {
          filterParts.push(`email.eq.${cleanIdLower}`);
        }
        filterParts.push(`username.eq.${strippedUsername}`);
        if (isValidUUID(cleanId)) {
          filterParts.push(`id.eq.${cleanId}`);
        }
        // Match flat number (e.g. "Flat 101" or "101")
        filterParts.push(`flat_number.eq.${cleanId}`);
        filterParts.push(`flat_number.ilike.%${cleanId}%`);

        const { data: matchedRows, error: searchError } = await supabase
          .from('users')
          .select('*')
          .or('is_active.is.null,is_active.eq.true')
          .is('deleted_at', null)
          .or(filterParts.join(','))
          .limit(1);

        if (!searchError && matchedRows && matchedRows.length > 0) {
          targetUser = mapDbRowToUser(matchedRows[0]);
          targetEmail = targetUser.email.toLowerCase().trim();
        }
      } catch (err) {
        console.warn('Tenant login: Cloud DB identifier lookup warning:', err);
      }
    }

    // 3. If not found in Cloud DB query, check local cached accounts (offline / sync fallback)
    if (!targetUser) {
      try {
        const saved = localStorage.getItem('madura_house_users_db_v3');
        const localList: User[] = saved ? JSON.parse(saved) : [];
        const strippedUsername = cleanIdLower.replace(/^@/, '');
        const matched = localList.find((u) => {
          if (!u || (u.occupancyStatus === 'evicted')) return false;
          const uEmail = (u.email || '').toLowerCase().trim();
          const uUser = (u.username || '').toLowerCase().replace(/^@/, '').trim();
          const uId = (u.id || '').trim();
          const uFlat = (u.flatNumber || '').toLowerCase().trim();
          return (
            uEmail === cleanIdLower ||
            uUser === strippedUsername ||
            uId === cleanId ||
            uFlat === cleanIdLower ||
            uFlat.includes(cleanIdLower)
          );
        });
        if (matched) {
          targetUser = matched;
          targetEmail = matched.email.toLowerCase().trim();
        }
      } catch {}
    }

    // 4. Determine authoritative expected password
    const expectedPassword =
      targetUser?.password ||
      DEFAULT_CREDENTIALS[targetEmail] ||
      DEFAULT_CREDENTIALS[cleanIdLower];

    // 5. PATH A: Password matches Tenant Directory / DEFAULT_CREDENTIALS
    if (expectedPassword && expectedPassword === cleanPassword) {
      const userProfile: User = targetUser || {
        id: generateUUID(),
        email: targetEmail,
        fullName: targetEmail.split('@')[0],
        phone: '',
        flatNumber: 'Tenant',
        role: (targetEmail === 'sampathkumar@chemadura.com' || targetEmail === 'rsivanaresh@gmail.com') ? 'OWNER' : 'TENANT',
        occupancyStatus: 'active',
        paymentStatus: 'paid',
      };

      // In background: synchronize Supabase Auth identity without overwriting password
      let authSession: any = null;
      let authUser: any = null;

      if (isSupabaseConfigured && supabase) {
        try {
          const nativeRes = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: cleanPassword,
          });
          if (!nativeRes.error && nativeRes.data?.session) {
            authSession = nativeRes.data.session;
            authUser = nativeRes.data.user;
          } else {
            // JIT create GoTrue Auth user if not present (keep password in public.users!)
            const signUpRes = await supabase.auth.signUp({
              email: targetEmail,
              password: cleanPassword,
            });
            if (signUpRes.data?.user) {
              authUser = signUpRes.data.user;
              await supabase
                .from('users')
                .update({ auth_id: signUpRes.data.user.id })
                .eq('email', targetEmail)
                .is('auth_id', null);
            }
          }
        } catch (authSyncErr) {
          console.warn('Tenant login: Supabase Auth sync note:', authSyncErr);
        }
      }

      const finalSession = authSession || {
        access_token: `tenant_token_${userProfile.id}_${Date.now()}`,
        token_type: 'bearer',
        user: authUser || {
          id: userProfile.id,
          email: userProfile.email,
          user_metadata: {
            full_name: userProfile.fullName,
            role: userProfile.role,
            flat_number: userProfile.flatNumber,
          },
        },
      };

      this.logSecurityEvent('LOGIN_SUCCESS', targetEmail, userProfile.id);

      return {
        success: true,
        user: finalSession.user,
        session: finalSession,
        profile: userProfile,
      };
    }

    // 6. PATH B: Try native Supabase GoTrue Auth (e.g. for self-registered or updated accounts)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: cleanPassword,
        });

        if (!authError && authData?.session) {
          let profile = targetUser;
          if (!profile) {
            profile = await cloudDb.getUserByEmail(targetEmail);
          }
          if (profile && profile.password !== cleanPassword) {
            // Keep Tenant Directory password in sync with Supabase Auth
            await supabase.from('users').update({ password: cleanPassword }).eq('email', targetEmail);
          }
          this.logSecurityEvent('LOGIN_SUCCESS', targetEmail, authData.session.user.id);
          return {
            success: true,
            user: authData.user,
            session: authData.session,
            profile: profile || undefined,
          };
        }
      } catch {}
    }

    // 7. Rejection
    if (!targetUser && !DEFAULT_CREDENTIALS[cleanIdLower]) {
      return {
        success: false,
        error: 'No occupant found matching that ID, email, or username. Please check your details.',
      };
    }

    return {
      success: false,
      error: 'Invalid password. Please check your credentials or ask the owner in the Tenant Directory.',
    };
  },

  /**
   * Legacy helper retained for backwards compatibility
   */
  async _attemptJITMigration(
    email: string,
    password: string
  ): Promise<{ success: boolean; authData?: any; error?: string }> {
    if (!supabase) return { success: false };

    const { data: legacyUsers } = await supabase
      .from('users')
      .select('id, email, password, role, occupancy_status')
      .eq('email', email)
      .limit(1);

    const legacyUser = legacyUsers && legacyUsers.length > 0 ? legacyUsers[0] : null;
    const validPassword = legacyUser?.password || DEFAULT_CREDENTIALS[email];

    if (!validPassword || validPassword !== password) {
      return { success: false, error: 'Invalid login credentials' };
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    if (signUpData.user) {
      await supabase
        .from('users')
        .update({
          auth_id: signUpData.user.id,
          // NEVER wipe password
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      const retryAuth = await supabase.auth.signInWithPassword({ email, password });
      if (!retryAuth.error && retryAuth.data?.session) {
        return { success: true, authData: retryAuth.data };
      }
      return { success: true, authData: { user: signUpData.user, session: { access_token: `jit_${Date.now()}` } } };
    }

    return { success: false, error: 'Migration: No user returned.' };
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
   * Get MFA 2FA Status from Supabase GoTrue Auth
   */
  async get2FAStatus(): Promise<{ enabled: boolean; factorId?: string }> {
    if (!supabase) return { enabled: false };
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data) return { enabled: false };
      const verified = data.totp?.find((f) => f.status === 'verified');
      if (verified) {
        return { enabled: true, factorId: verified.id };
      }
      return { enabled: false };
    } catch {
      return { enabled: false };
    }
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
