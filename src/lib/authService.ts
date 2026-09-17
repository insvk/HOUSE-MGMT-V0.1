import { supabase, isSupabaseConfigured, cloudDb, generateUUID } from './supabaseClient';
import { User, UserRole } from '../types';
import { DEFAULT_CREDENTIALS } from '../data/initialData';

/**
 * Enterprise Authentication Service mapping to Supabase Auth (GoTrue).
 * Implements Just-In-Time (JIT) migration for legacy users with plaintext passwords.
 */
export const authService = {
  /**
   * Main Login Handler
   * Attempts Supabase Auth login. If user is not found but exists in legacy `users` table,
   * performs a seamless JIT migration into Supabase Auth.
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Auth system offline' };
    }
    // Remove any zero-width spaces, invisible characters, and all whitespace
    const cleanEmail = email.replace(/[\u200B-\u200D\uFEFF\s]/g, '').trim().toLowerCase();

    // 1. Attempt standard Supabase Auth Login
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (authError && authError.message.includes('Invalid login credentials')) {
      // 2. JIT Migration Fallback
      // Check if user exists in the legacy `public.users` table
      const { data: legacyUsers, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail);

      if (!dbError) {
        let legacyUser = legacyUsers && legacyUsers.length > 0 ? legacyUsers[0] : null;
        let validPassword = legacyUser?.password || DEFAULT_CREDENTIALS[cleanEmail];
        
        // If they aren't in the DB, but they ARE in DEFAULT_CREDENTIALS, allow JIT migration for hardcoded admins
        if (!legacyUser && DEFAULT_CREDENTIALS[cleanEmail]) {
           validPassword = DEFAULT_CREDENTIALS[cleanEmail];
        }

        if (validPassword && validPassword === password) {
          // Passwords match! Migrate them to Supabase Auth silently
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
          });

          if (signUpError) {
            return { success: false, error: `Migration failed: ${signUpError.message}` };
          }

          // Link public.users to auth.users and scrub plaintext password
          if (signUpData.user) {
            if (legacyUser) {
              await supabase
                .from('users')
                .update({
                  auth_id: signUpData.user.id,
                  password: null, // Scrub the plaintext password securely
                  updated_at: new Date().toISOString()
                })
                .eq('email', cleanEmail);
            } else {
              // Insert missing admin into public.users
              await supabase.from('users').insert({
                auth_id: signUpData.user.id,
                email: cleanEmail,
                "fullName": cleanEmail.split('@')[0],
                role: 'OWNER',
                "occupancyStatus": 'active'
              });
            }
            
            // Re-attempt login to ensure session is properly established
            const retryAuth = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password,
            });
            authData = retryAuth.data;
            authError = retryAuth.error;
          }
        }
      }
    }

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (authData.session) {
      this.logSecurityEvent('LOGIN_SUCCESS', cleanEmail, authData.session.user.id);
    }

    return { 
      success: true, 
      user: authData.user, 
      session: authData.session 
    };
  },

  /**
   * Register a new user natively into Supabase Auth
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Offline' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { success: false, error: error.message };
    
    // We do NOT create the public.user here; it will be created by the UI caller
    // but the UI caller needs to inject the auth_id.
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
    
    // We log the attempt, but we do not reveal if the email exists.
    this.logSecurityEvent('PASSWORD_RESET_REQUESTED', email);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    // Account enumeration protection: always return success generically.
    if (error) {
       console.error("Reset requested for non-existent or failed email", error.message);
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

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) return { success: false, error: error.message };

    if (data.user) {
      this.logSecurityEvent('PASSWORD_CHANGED', data.user.email || 'unknown', data.user.id);
    }
    return { success: true };
  },

  /**
   * 2FA (TOTP) Enrollment Initialization
   */
  async enrollTOTP(): Promise<{ success: boolean; qrCodeUrl?: string; secret?: string; factorId?: string; error?: string }> {
    if (!supabase) return { success: false, error: 'Offline' };
    
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });

    if (error) return { success: false, error: error.message };
    
    return {
      success: true,
      qrCodeUrl: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id
    };
  },

  /**
   * 2FA Verification (Complete Enrollment or Verify Login Challenge)
   */
  async verifyTOTP(factorId: string, code: string): Promise<{ success: boolean; error?: string }> {
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
      this.logSecurityEvent('TWO_FACTOR_VERIFIED', data.session.user.email || 'unknown', data.session.user.id);
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
   * Log Security Events to DB
   */
  logSecurityEvent(eventType: string, email: string, authId?: string) {
    if (!supabase) return;
    supabase.from('security_events').insert({
      event_type: eventType,
      user_email: email,
      auth_id: authId || null,
      user_agent: navigator.userAgent
    }).then(({ error }) => {
      if (error) console.error('Security log error:', error);
    }); // Fire and forget
  }
};
