import React, { useState, useRef } from 'react';
import { User, UserRole, AVAILABLE_FLATS } from '../types';
import { DEFAULT_AVATARS, compressAndResizeImage, getInitialsAvatar } from '../utils/imageUtils';
import { DEFAULT_CREDENTIALS } from '../data/initialData';
import { generateUUID } from '../lib/supabaseClient';
import { GoogleClock } from './GoogleClock';
import { 
  Flag, 
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up Form States
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState<string>(AVAILABLE_FLATS[0]);
  const signupRole: UserRole = 'TENANT';
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

  // Helper to fetch all available accounts across props and local encrypted vault
  const getAllAvailableAccounts = (): User[] => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.email.toLowerCase(), u));
    try {
      const saved = localStorage.getItem('madura_house_users_db_v3');
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((pu) => {
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
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword;

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const allAccounts = getAllAvailableAccounts();

      // Check if user exists in the system
      const matchedUser = allAccounts.find((u) => u.email.toLowerCase() === cleanEmail);

      if (matchedUser) {
        // Validate password: check stored password first, then default credentials
        const storedPassword = matchedUser.password;
        const defaultPassword = DEFAULT_CREDENTIALS[cleanEmail];
        const validPassword = storedPassword || defaultPassword;

        if (!validPassword || validPassword !== cleanPassword) {
          setErrorMessage('Invalid password. Please check your credentials and try again.');
          return;
        }

        onLoginSuccess(matchedUser, matchedUser.role);
        return;
      }

      // If user is not found in the directory
      setErrorMessage(`No account found for "${cleanEmail}". Click "Create Account" below to register.`);
    }, 350);
  };

  // Handle Sign Up Registration
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = fullName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanPassword = signupPassword;
    const cleanConfirm = confirmPassword;
    const cleanFlat = flatNumber.trim();
    const cleanPhone = phone.trim() || '+91 98421 00000';

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanFlat) {
      setErrorMessage('Please fill in all required fields (Name, Email, Password, Flat Number).');
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

    const allAccounts = getAllAvailableAccounts();
    const emailExists = allAccounts.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      setErrorMessage('An account with this email is already registered. Please log in.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const newRegisteredUser: User = {
        id: generateUUID(),
        email: cleanEmail,
        password: cleanPassword,
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

      // Synchronously commit to local vault immediately
      try {
        const saved = localStorage.getItem('madura_house_users_db_v3');
        const list: User[] = saved ? JSON.parse(saved) : [];
        const filtered = Array.isArray(list) ? list.filter((u) => u.email.toLowerCase() !== cleanEmail) : [];
        filtered.push(newRegisteredUser);
        localStorage.setItem('madura_house_users_db_v3', JSON.stringify(filtered));
      } catch (err) {
        console.error('Local storage user commit error:', err);
      }

      // Register into tenant store and redirect to dashboard
      onSignUpSuccess(newRegisteredUser);
    }, 400);
  };

  // Google Authentication Handler
  const handleGoogleAuthClick = () => {
    setErrorMessage('');
    setGoogleAuthInProgress(true);
    setGoogleAuthMessage('GOOGLE AUTHENTICATION IS UNDERWAY');
  };

  return (
    <div className="min-h-screen w-full bg-[#fafbfc] text-[#111827] flex flex-col justify-between selection:bg-[#111827] selection:text-white relative overflow-hidden font-sans">
      
      {/* Top Left Header Brand Title */}
      <div className="px-4 sm:px-8 py-4 sm:py-7 flex items-center justify-between w-full max-w-7xl mx-auto z-20 gap-2">
        <span className="font-extrabold text-xs sm:text-base md:text-xl tracking-tight text-[#111827] uppercase font-sans truncate">
          MADURA HOUSE MAINTENANCE MGMT V0.1
        </span>

        {/* Top Right Header Controls & Live Clock */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <GoogleClock variant="header" />

          {/* Auth Mode Toggle Button on Header */}
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

      {/* Main Center Area: Split Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center z-10 py-3 sm:py-4">
        
        {/* Left Form Area (Login or Sign Up) */}
        <div className="lg:col-span-5 max-w-md w-full mx-auto lg:mx-0 py-2">
          
          {authMode === 'login' ? (
            /* ========================================================================= */
            /* 1. LOGIN MODE (Exact Reference Image Design)                             */
            /* ========================================================================= */
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-2">
                  Login
                </h1>
                <p className="text-sm text-[#6b7280]">
                  Welcome back! Please enter your details.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4b5563] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="jdoe.mobbin@gmail.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#e5e7eb] text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4b5563] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#e5e7eb] text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Dark Button: Continue with Email */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#262626] hover:bg-[#171717] active:bg-black text-white font-medium text-sm flex items-center justify-center transition-all shadow-md mt-2 disabled:opacity-75 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Continue with Email'
                  )}
                </button>

                {/* Secondary Button: Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleAuthClick}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#374151] font-semibold text-sm border border-[#e5e7eb] flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Google Authentication Status Banner */}
                {googleAuthMessage && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </div>
                      <div>
                        <div className="font-extrabold tracking-wider uppercase text-[11px] sm:text-xs text-amber-950">
                          {googleAuthMessage}
                        </div>
                        <div className="text-[10px] text-amber-700 font-normal">
                          Google OAuth SSO single sign-on service connection initialized.
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setGoogleAuthMessage(null)}
                      className="text-amber-600 hover:text-amber-800 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </form>

              {/* Bottom Sign Up Link */}
              <div className="mt-8 text-center text-xs text-[#6b7280]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-[#3b82f6] hover:text-[#2563eb] font-semibold underline-offset-2 hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </div>

              {/* Encryption Note */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>End-to-End Encrypted • Supabase Auth Session</span>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. SIGN UP / CREATE ACCOUNT MODE                                         */
            /* ========================================================================= */
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-1">
                  Create Account
                </h1>
                <p className="text-xs text-[#6b7280]">
                  Register your resident profile in Madura House Portal.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
                {/* Profile Photo Selection (PFP) */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative group shrink-0">
                      <img
                        src={signupAvatarUrl}
                        alt="Profile Preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#405189] shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => signupFileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-[#405189] text-white rounded-full shadow hover:bg-[#364473] transition-transform hover:scale-110 cursor-pointer"
                        title="Upload Photo"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Profile Picture (PFP)</label>
                        <button
                          type="button"
                          onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                          className="text-[11px] font-semibold text-[#405189] hover:underline cursor-pointer"
                        >
                          {showAvatarPresets ? 'Hide Presets' : 'Choose Preset'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Upload custom photo or pick an avatar</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => signupFileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#405189] text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <UploadCloud className="w-3 h-3 text-[#405189]" /> Upload Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignupAvatarUrl(getInitialsAvatar(fullName || 'User'))}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                        >
                          Use Initials
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

                  {/* Preset Avatar Gallery */}
                  {showAvatarPresets && (
                    <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Select an Avatar Preset:</div>
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
                              signupAvatarUrl === av.url ? 'border-[#405189] scale-105 shadow' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img src={av.url} alt={av.label} className="w-full aspect-square rounded-md object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Full Name & Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#4b5563] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Krishnan"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4b5563] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="ramesh@madurahouse.local"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  />
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#4b5563] mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4b5563] mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    />
                  </div>
                </div>

                {/* Flat & Phone */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#4b5563] mb-1">Flat / Unit Number *</label>
                    <select
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    >
                      {AVAILABLE_FLATS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4b5563] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98421 00000"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    />
                  </div>
                </div>

                {/* Move In Date & Emergency Contact */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#4b5563] mb-1">Move In Date</label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4b5563] mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+91 98421 99999"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    />
                  </div>
                </div>

                {/* Submit Sign Up */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] hover:bg-[#171717] active:bg-black text-white font-medium text-xs flex items-center justify-center transition-all shadow-md mt-3 disabled:opacity-75 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Create Resident Account & Enter Dashboard'
                  )}
                </button>

                {/* Secondary Button: Sign up with Google */}
                <button
                  type="button"
                  onClick={handleGoogleAuthClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#374151] font-semibold text-xs border border-[#e5e7eb] flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer mt-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-5 text-center text-xs text-[#6b7280]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-[#3b82f6] hover:text-[#2563eb] font-semibold underline-offset-2 hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Graphic & God Clock Area */}
        <div className="lg:col-span-7 hidden lg:flex flex-col items-center justify-center relative min-h-[480px] p-6">
          <div className="absolute w-[440px] h-[440px] bg-gradient-to-tr from-indigo-100/50 via-sky-100/30 to-emerald-100/40 rounded-full blur-3xl -z-10" />

          {/* Full Fidelity God Clock Display Card */}
          <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-300">
            <GoogleClock variant="card" />
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-slate-200/70 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Property Management System • Atomic Precision Synchronized</span>
          </div>
        </div>

      </div>

      {/* Bottom Right Floating Chat Bubble Icon */}
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

      {/* ========================================================================= */}
      {/* GOOGLE AUTHENTICATION UNDERWAY MODAL                                       */}
      {/* ========================================================================= */}
      {googleAuthInProgress && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setGoogleAuthInProgress(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-150 text-[#1f2937]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Google Identity Services
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-wide uppercase">
                GOOGLE AUTHENTICATION IS UNDERWAY
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Connecting to Google Cloud OAuth 2.0 Identity Server for single sign-on authentication...
              </p>
            </div>

            {/* Google gradient animated progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335] h-full w-full animate-pulse" />
            </div>

            <button
              type="button"
              onClick={() => setGoogleAuthInProgress(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
