import React, { useState, useRef } from 'react';
import { User, UserRole, AVAILABLE_FLATS } from '../types';
import { DEFAULT_AVATARS, compressAndResizeImage, getInitialsAvatar } from '../utils/imageUtils';
import { DEFAULT_CREDENTIALS, isDummyLegacyAccount } from '../data/initialData';
import { generateUUID } from '../lib/supabaseClient';
import { GoogleClock } from './GoogleClock';
import { 
  Flag, 
  Zap,
  Menu, 
  Grid, 
  Disc, 
  ListFilter, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Sparkles, 
  UserPlus, 
  Home, 
  Phone, 
  Calendar, 
  IndianRupee, 
  PhoneCall,
  X,
  ChevronRight,
  Camera,
  UploadCloud,
  RotateCcw
} from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User, role: UserRole) => void;
  onSignUpSuccess: (newUser: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  users, 
  onLoginSuccess,
  onSignUpSuccess 
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot_password' | 'verify_otp' | 'reset_password' | 'mfa_challenge'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up Form States
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('TENANT');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // OTP / Reset Form States
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentAmount, setRentAmount] = useState('14000');
  const [depositAmount, setDepositAmount] = useState('70000');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [signupAvatarUrl, setSignupAvatarUrl] = useState<string>(DEFAULT_AVATARS[0].url);
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const signupFileInputRef = useRef<HTMLInputElement>(null);

  const handleSignupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 260, 0.85);
      setSignupAvatarUrl(compressed);
      setSuccessMessage('Profile photo loaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image');
    }
  };

  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleAuthMessage, setGoogleAuthMessage] = useState<string | null>(null);
  const [googleAuthInProgress, setGoogleAuthInProgress] = useState(false);

  // Mouse tracking for background effect
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Helper to fetch all available accounts across props and local encrypted vault
  const getAllAvailableAccounts = (): User[] => {
    const map = new Map<string, User>();
    users.filter((u) => u.email && !isDummyLegacyAccount(u.email)).forEach((u) => map.set(u.email.toLowerCase(), u));
    try {
      const saved = localStorage.getItem('madura_house_users_db_v3');
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((pu) => {
            if (!pu.email || isDummyLegacyAccount(pu.email)) return;
            const existing = map.get(pu.email.toLowerCase());
            if (existing) {
              map.set(pu.email.toLowerCase(), {
                ...existing,
                ...pu,
                password: pu.password || existing.password,
                role: pu.role || existing.role,
              });
            } else {
              map.set(pu.email.toLowerCase(), pu);
            }
          });
        }
      }
    } catch {}
    return Array.from(map.values());
  };

  // Handle Login Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword;

    if (!cleanEmail) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const { authService } = await import('../lib/authService');
      const authRes = await authService.login(cleanEmail, cleanPassword);

      if (!authRes.success) {
        setErrorMessage(authRes.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }

      // If login is successful, map it to the expected onLoginSuccess format
      // In a real enterprise app, we rely on the JWT context or DB fetch.
      // Here, we grab the updated profile from the legacy array.
      const allAccounts = getAllAvailableAccounts();
      const matchedUser = allAccounts.find((u) => u.email.toLowerCase() === cleanEmail);
      
      if (matchedUser) {
        onLoginSuccess(matchedUser, matchedUser.role);
      } else {
        onLoginSuccess({
          id: authRes.user?.id || 'unknown',
          email: cleanEmail,
          fullName: 'Authenticated User',
          flatNumber: 'Unknown',
          role: 'TENANT',
          phone: '',
          paymentStatus: 'pending',
          occupancyStatus: 'active'
        }, 'TENANT');
      }
    } catch (err: any) {
      setErrorMessage('Auth Service Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up Registration
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = fullName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanPassword = signupPassword;
    const cleanConfirm = confirmPassword;
    const cleanFlat = flatNumber.trim();
    const cleanPhone = phone.trim() || '+91 98421 00000';

    const cleanUsername = signupUsername.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !cleanUsername || !cleanPassword || !cleanFlat) {
      setErrorMessage('Please fill in all required fields (Name, Username, Email, Password, Flat Number).');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      const { authService } = await import('../lib/authService');
      const allAccounts = getAllAvailableAccounts();
      const exists = allAccounts.some((u) => u.email.toLowerCase() === cleanEmail);

      if (exists) {
        setErrorMessage('An account with this email already exists. Please login instead.');
        setIsLoading(false);
        return;
      }

      const signUpRes = await authService.signUp(cleanEmail, cleanPassword);

      if (!signUpRes.success) {
        setErrorMessage(signUpRes.error || 'Sign up failed.');
        setIsLoading(false);
        return;
      }

      const newRegisteredUser: User = {
        id: signUpRes.user?.id || generateUUID(),
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPassword, // Stored locally only until fully integrated
        fullName: cleanName,
        phone: cleanPhone,
        flatNumber: cleanFlat,
        role: signupRole,
        occupancyStatus: 'active',
        paymentStatus: 'paid',
        avatarUrl: signupAvatarUrl || DEFAULT_AVATARS[0].url,
        moveInDate: moveInDate || new Date().toISOString().split('T')[0],
        rentAmount: rentAmount ? parseFloat(rentAmount) : 14000,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 70000,
        emergencyContact: emergencyContact.trim(),
        notes: `Registered via Portal on ${new Date().toLocaleDateString()}`,
      };

      // Synchronously commit to local vault immediately for offline support
      try {
        const saved = localStorage.getItem('madura_house_users_db_v3');
        const list: User[] = saved ? JSON.parse(saved) : [];
        const filtered = Array.isArray(list) ? list.filter((u) => u.email.toLowerCase() !== cleanEmail) : [];
        filtered.push(newRegisteredUser);
        localStorage.setItem('madura_house_users_db_v3', JSON.stringify(filtered));
      } catch (err) {
        console.error('Local storage user commit error:', err);
      }

      onSignUpSuccess(newRegisteredUser);
    } catch (err: any) {
      setErrorMessage('Auth Service Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Request (OTP)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!loginEmail) {
      setErrorMessage('Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    try {
      const { authService } = await import('../lib/authService');
      const res = await authService.requestPasswordReset(loginEmail.trim().toLowerCase());
      if (res.success) {
        setSuccessMessage('Recovery code sent! Check your inbox.');
        setAuthMode('verify_otp');
      } else {
        setErrorMessage(res.error || 'Failed to send recovery code.');
      }
    } catch (err: any) {
      setErrorMessage('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!otpCode) {
      setErrorMessage('Please enter the verification code.');
      return;
    }
    setIsLoading(true);
    try {
      const { authService } = await import('../lib/authService');
      const res = await authService.verifyOTP(loginEmail.trim().toLowerCase(), otpCode.trim());
      if (res.success) {
        setSuccessMessage('Code verified. Please set a new password.');
        setAuthMode('reset_password');
      } else {
        setErrorMessage(res.error || 'Invalid code.');
      }
    } catch (err: any) {
      setErrorMessage('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const { authService } = await import('../lib/authService');
      const res = await authService.updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage('Password updated successfully! Please log in.');
        setAuthMode('login');
      } else {
        setErrorMessage(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMessage('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Authentication Handler
  const handleGoogleAuthClick = () => {
    setErrorMessage('');
    setGoogleAuthInProgress(true);
    setGoogleAuthMessage('GOOGLE AUTHENTICATION IS UNDERWAY');
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#f4f7fb] text-[#111827] flex flex-col justify-between selection:bg-[#111827] selection:text-white relative overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
    >
      {/* Background Effect */}
      <div
        className="absolute w-[800px] h-[800px] bg-[#38bdf8]/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-100 ease-out z-0"
        style={{
          transform: `translate(${mousePos.x - 400}px, ${mousePos.y - 400}px)`
        }}
      />
      
      {/* Top Header */}
      <div className="px-4 sm:px-8 py-4 sm:py-7 flex items-center justify-between w-full max-w-7xl mx-auto z-20 gap-2 relative">
        <span className="font-extrabold text-xs sm:text-base md:text-xl tracking-tight text-[#111827] uppercase font-sans truncate">
          MADURA HOUSE MAINTENANCE MGMT V0.1
        </span>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <GoogleClock variant="header" />
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            {authMode === 'login' ? 'Create Account →' : '← Login'}
          </button>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="w-full flex-1 flex items-center justify-center z-10 p-4 relative">
        <div className="w-full max-w-[400px] bg-white rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          
          {authMode === 'login' ? (
            /* LOGIN MODE */
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 bg-[#111827] rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-black/10">
                  <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <h1 className="text-[26px] font-bold text-[#111827] tracking-tight mb-1">
                  Welcome back
                </h1>
                <p className="text-[13px] text-slate-500 font-medium">
                  Enter your credentials to access your account
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    EMAIL OR USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com or @username"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      PASSWORD
                    </label>
                    <button type="button" onClick={() => { setAuthMode('forgot_password'); setErrorMessage(''); setSuccessMessage(''); }} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0a0a0a] hover:bg-black active:bg-black text-white font-medium text-sm flex items-center justify-center transition-all shadow-md mt-6 disabled:opacity-75 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </button>
                
                <div className="flex items-center justify-center py-2 mt-4">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="px-4 text-[11px] font-medium text-slate-400">Or continue with</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuthClick}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#374151] font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Google</span>
                </button>
              </form>

              <div className="mt-8 text-center text-[13px] text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            </div>
          ) : authMode === 'signup' ? (
            /* SIGN UP MODE (using same centered layout for consistency) */
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-black/20">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[#111827] tracking-tight mb-1">
                  Create Account
                </h1>
                <p className="text-[12px] text-slate-500 font-medium">
                  Register your resident profile
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Profile Photo Selection */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative group shrink-0">
                      <img
                        src={signupAvatarUrl}
                        alt="Profile Preview"
                        className="w-12 h-12 rounded-full object-cover border-2 border-black shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => signupFileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1 bg-black text-white rounded-full shadow hover:bg-gray-800 transition-transform hover:scale-110 cursor-pointer"
                        title="Upload Photo"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Photo</label>
                        <button
                          type="button"
                          onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          {showAvatarPresets ? 'Hide Presets' : 'Presets'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => signupFileInputRef.current?.click()}
                          className="px-2 py-1 bg-white border border-slate-300 hover:border-black text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <UploadCloud className="w-3 h-3" /> Upload
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={signupFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignupPhotoUpload}
                    className="hidden"
                  />

                  {showAvatarPresets && (
                    <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                      <div className="grid grid-cols-4 gap-2">
                        {DEFAULT_AVATARS.map((av) => (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => {
                              setSignupAvatarUrl(av.url);
                              setShowAvatarPresets(false);
                            }}
                            className={`p-0.5 rounded-lg border-2 transition-all cursor-pointer ${
                              signupAvatarUrl === av.url ? 'border-black scale-105 shadow' : 'border-transparent hover:border-slate-300'
                            }`}
                          >
                            <img src={av.url} alt={av.label} className="w-full aspect-square rounded-md object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Anand Sundaram"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="@johndoe"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="resident@example.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit *</label>
                    <select
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    >
                      {AVAILABLE_FLATS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-gray-900 active:bg-black text-white font-semibold text-sm flex items-center justify-center transition-all shadow-md mt-6 disabled:opacity-75 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-[13px] text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
          ) : authMode === 'forgot_password' ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <h1 className="text-2xl font-bold text-[#111827] tracking-tight mb-1">Reset Password</h1>
                <p className="text-[12px] text-slate-500 font-medium">Enter your email to receive a recovery code</p>
              </div>
              {errorMessage && <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-600">{errorMessage}</div>}
              {successMessage && <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700">{successMessage}</div>}
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">EMAIL</label>
                  <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-black" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl bg-black text-white font-semibold text-sm cursor-pointer hover:bg-gray-900 disabled:opacity-75">
                  {isLoading ? 'Sending...' : 'Send Recovery Code'}
                </button>
              </form>
              <div className="mt-6 text-center text-[13px]">
                <button onClick={() => setAuthMode('login')} className="text-blue-600 font-semibold">← Back to login</button>
              </div>
            </div>
          ) : authMode === 'verify_otp' ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <h1 className="text-2xl font-bold text-[#111827] tracking-tight mb-1">Enter Code</h1>
                <p className="text-[12px] text-slate-500 font-medium">We sent a verification code to {loginEmail}</p>
              </div>
              {errorMessage && <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-600">{errorMessage}</div>}
              {successMessage && <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700">{successMessage}</div>}
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">6-DIGIT CODE</label>
                  <input type="text" required value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm tracking-widest text-center font-mono focus:ring-2 focus:ring-black" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl bg-black text-white font-semibold text-sm cursor-pointer hover:bg-gray-900 disabled:opacity-75">
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </div>
          ) : authMode === 'reset_password' ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <h1 className="text-2xl font-bold text-[#111827] tracking-tight mb-1">Set New Password</h1>
                <p className="text-[12px] text-slate-500 font-medium">Create a strong password for your account</p>
              </div>
              {errorMessage && <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-600">{errorMessage}</div>}
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">NEW PASSWORD</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-black" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl bg-black text-white font-semibold text-sm cursor-pointer hover:bg-gray-900 disabled:opacity-75">
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => alert('Madura House Resident Support: Connect with Property Administration.')}
          className="w-12 h-12 rounded-2xl bg-[#111827] hover:bg-black text-white flex items-center justify-center shadow-xl shadow-black/20 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title="Need Help?"
        >
          <MessageSquare className="w-5 h-5 fill-white" />
        </button>
      </div>

      {/* Google Auth Underway Modal */}
      {googleAuthInProgress && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setGoogleAuthInProgress(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                Google Identity
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                Authenticating
              </h3>
              <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                Connecting to Google OAuth 2.0 services...
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335] h-full w-full animate-pulse" />
            </div>

            <button
              type="button"
              onClick={() => setGoogleAuthInProgress(false)}
              className="w-full py-3 px-4 rounded-xl bg-black hover:bg-gray-900 text-white text-sm font-semibold transition-colors cursor-pointer shadow-md mt-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
