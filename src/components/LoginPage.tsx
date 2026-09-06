import React, { useState } from 'react';
import { User, UserRole } from '../types';
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
  ChevronRight
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
  const [flatNumber, setFlatNumber] = useState('Flat 101');
  const [role, setRole] = useState<UserRole>('TENANT');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentAmount, setRentAmount] = useState('14000');
  const [depositAmount, setDepositAmount] = useState('70000');
  const [emergencyContact, setEmergencyContact] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Handle Login Authentication
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanEmail = loginEmail.trim().toLowerCase();

      // Check if user exists in the system
      const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (matchedUser) {
        // Validate password if user has one stored
        if (matchedUser.password && matchedUser.password !== loginPassword) {
          setErrorMessage('Invalid password. Please try again or use the correct credentials.');
          return;
        }

        onLoginSuccess(matchedUser, matchedUser.role);
        return;
      }

      // Check for Owner default email
      if (cleanEmail === 'sampathkumar@chemadur.com') {
        const ownerUser: User = {
          id: 'u-owner-01',
          email: cleanEmail,
          password: loginPassword,
          fullName: 'Sampath Kumar',
          phone: '+91 98421 00000',
          flatNumber: 'Owner Suite',
          role: 'OWNER',
          occupancyStatus: 'active',
          paymentStatus: 'paid',
        };
        onLoginSuccess(ownerUser, 'OWNER');
        return;
      }

      // If user is not found in the directory
      setErrorMessage('Account not found with this email. Please click "Sign up" below to register your resident profile.');
    }, 400);
  };

  // Handle Sign Up Registration
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || !signupEmail.trim() || !signupPassword || !flatNumber.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    const cleanEmail = signupEmail.trim().toLowerCase();

    // Check if email already registered
    const emailExists = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      setErrorMessage('An account with this email is already registered. Please log in.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const newRegisteredUser: User = {
        id: `u-${Date.now().toString().slice(-4)}`,
        email: cleanEmail,
        password: signupPassword,
        fullName: fullName.trim(),
        phone: phone.trim() || '+91 98421 00000',
        flatNumber: flatNumber.trim(),
        role: role,
        occupancyStatus: 'active',
        paymentStatus: 'paid',
        avatarUrl: role === 'OWNER' 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        moveInDate: moveInDate || new Date().toISOString().split('T')[0],
        rentAmount: rentAmount ? parseFloat(rentAmount) : 14000,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 70000,
        emergencyContact: emergencyContact.trim(),
        notes: `Registered via Portal on ${new Date().toLocaleDateString()}`,
      };

      // Register into tenant store and redirect to dashboard
      onSignUpSuccess(newRegisteredUser);
    }, 500);
  };

  // Google Login Account Selection
  const handleSelectGoogleAccount = (selectedUser: User) => {
    setShowGoogleModal(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(selectedUser, selectedUser.role);
    }, 350);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;

    const clean = customGoogleEmail.trim().toLowerCase();
    const matched = users.find((u) => u.email.toLowerCase() === clean);

    setShowGoogleModal(false);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (matched) {
        onLoginSuccess(matched, matched.role);
      } else {
        // Standard tenant resident account creation for new Google user
        const newGoogleUser: User = {
          id: `u-${Date.now().toString().slice(-4)}`,
          email: clean,
          fullName: clean.split('@')[0].replace('.', ' ').toUpperCase(),
          phone: '+91 98421 00000',
          flatNumber: 'Flat 101',
          role: 'TENANT',
          occupancyStatus: 'active',
          paymentStatus: 'paid',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          moveInDate: new Date().toISOString().split('T')[0],
          rentAmount: 14000,
          depositAmount: 70000,
        };
        onSignUpSuccess(newGoogleUser);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#fafbfc] text-[#111827] flex flex-col justify-between selection:bg-[#111827] selection:text-white relative overflow-hidden font-sans">
      
      {/* Top Left Header Brand Title */}
      <div className="px-8 py-7 flex items-center justify-between w-full max-w-7xl mx-auto z-20">
        <span className="font-extrabold text-lg md:text-xl tracking-tight text-[#111827] uppercase font-sans">
          MADURA HOUSE MAINTENANCE MGMT V0.1
        </span>

        {/* Auth Mode Toggle Button on Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            {authMode === 'login' ? 'Create New Account →' : '← Back to Login'}
          </button>
        </div>
      </div>

      {/* Main Center Area: Split Grid */}
      <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center z-10 py-4">
        
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

                {/* Secondary Button: Continue with Google (Opens Google Identity Selector) */}
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
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
                      <option value="Flat 101">Flat 101</option>
                      <option value="Flat 102">Flat 102</option>
                      <option value="Flat 201">Flat 201</option>
                      <option value="Flat 202">Flat 202</option>
                      <option value="Flat 301">Flat 301</option>
                      <option value="Flat 302">Flat 302</option>
                      <option value="Owner Suite">Owner Suite</option>
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

                {/* Role Level */}
                <div>
                  <label className="block text-xs font-semibold text-[#4b5563] mb-1">Role Privilege Level</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  >
                    <option value="TENANT">Regular Tenant (Standard Resident View)</option>
                    <option value="ADMIN_TENANT">Admin Tenant (Can Manage Expenses)</option>
                    <option value="OWNER">House Owner (Property Admin)</option>
                  </select>
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

        {/* Right Graphic Area */}
        <div className="lg:col-span-7 hidden lg:flex items-center justify-center relative min-h-[460px] select-none pointer-events-none">
          <div className="absolute w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl -z-10" />

          <div className="relative w-full max-w-lg h-96">
            <div className="absolute top-12 left-4 w-14 h-14 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 transform -rotate-6 animate-bounce" style={{ animationDuration: '6s' }}>
              <Flag className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="absolute top-8 left-36 w-2.5 h-2.5 rounded-full bg-[#6d28d9]" />

            <div className="absolute top-6 right-24 w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 animate-pulse" style={{ animationDuration: '4s' }}>
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="absolute top-20 left-48 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-indigo-100">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Tenant"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute top-44 left-16 w-3 h-3 rounded-full bg-[#f59e0b]" />

            <div className="absolute top-48 left-28 w-12 h-12 rounded-full bg-[#f97316] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Grid className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="absolute top-40 right-48 w-2 h-2 rounded-full bg-[#111827]" />

            <div className="absolute bottom-10 left-28 w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Disc className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="absolute top-36 right-6 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xl bg-purple-100">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                alt="Resident"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute bottom-16 right-32 w-12 h-12 rounded-full bg-[#fbbf24] flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
              <ListFilter className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="absolute bottom-20 right-12 w-3 h-3 rounded-full bg-[#f59e0b]" />
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
      {/* GOOGLE IDENTITY ACCOUNT CHOOSER POPUP MODAL                               */}
      {/* ========================================================================= */}
      {showGoogleModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowGoogleModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#1f2937]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Google Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span className="font-bold text-sm text-slate-800">Sign in with Google</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">Choose an account</h2>
                <p className="text-xs text-slate-500 mt-0.5">to continue to Madura House Maintenance Portal</p>
              </div>

              <button 
                onClick={() => setShowGoogleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Resident Accounts */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {users.map((u) => {
                const isOwner = u.role === 'OWNER';
                const isAdmin = u.role === 'ADMIN_TENANT';

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectGoogleAccount(u)}
                    className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        isOwner ? 'bg-indigo-50 text-indigo-700' :
                        isAdmin ? 'bg-sky-50 text-sky-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {isOwner ? 'Owner' : isAdmin ? 'Admin' : `${u.flatNumber}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Google Email Input */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Or enter another Google account:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="resident@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>To continue, Google will share your name & email.</span>
              <button onClick={() => setShowGoogleModal(false)} className="text-blue-600 hover:underline font-semibold cursor-pointer">
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
