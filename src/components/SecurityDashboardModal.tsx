import React, { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../lib/authService';

interface SecurityDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const SecurityDashboardModal: React.FC<SecurityDashboardModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'password' | '2fa' | 'sessions'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  
  // 2FA State
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      authService.get2FAStatus().then((res) => {
        if (res && res.enabled) setIs2FAEnabled(true);
      });
      if (activeTab === 'sessions') {
        fetchSessions();
      }
    }
  }, [isOpen, activeTab]);

  const fetchSessions = async () => {
    // In a full implementation, you would query `security_events` or `supabase.auth.mfa.listFactors()` here
    // Currently mapping to current session via authService wrapper.
    const { data } = await authService.getSession();
    if (data.session) {
      setSessions([{
        id: data.session.user.id,
        device: navigator.userAgent,
        ip: 'Current IP',
        lastActive: new Date().toLocaleString()
      }]);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    const res = await authService.updatePassword(newPassword);
    if (res.success) {
      setSuccessMessage('Password updated successfully!');
      setNewPassword('');
    } else {
      setErrorMessage(res.error || 'Failed to update password.');
    }
    setIsLoading(false);
  };

  const handleEnroll2FA = async () => {
    setErrorMessage('');
    setIsLoading(true);
    const res = await authService.enrollTOTP();
    if (res.success) {
      setQrCodeUrl(res.qrCodeUrl || '');
      setSecret(res.secret || '');
      setFactorId(res.factorId || '');
    } else {
      setErrorMessage(res.error || 'Failed to initiate 2FA enrollment.');
    }
    setIsLoading(false);
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    const res = await authService.verifyTOTP(factorId, verificationCode);
    if (res.success) {
      setSuccessMessage('2FA enabled successfully!');
      setIs2FAEnabled(true);
      setQrCodeUrl('');
    } else {
      setErrorMessage(res.error || 'Failed to verify code.');
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900/95 backdrop-blur z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Account Security</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-slate-50 dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                activeTab === 'password'
                  ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800/50 hover:text-slate-700 dark:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" /> Password
            </button>
            <button
              onClick={() => setActiveTab('2fa')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                activeTab === '2fa'
                  ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800/50 hover:text-slate-700 dark:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> 2FA (TOTP)
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800/50 hover:text-slate-700 dark:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" /> Active Sessions
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Change Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Ensure your account is using a long, random password to stay secure.</p>
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-black disabled:opacity-50">
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === '2fa' && (
              <div className="animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Add additional security to your account using TOTP applications like Google Authenticator.</p>
                
                {is2FAEnabled ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">2FA is Enabled</p>
                      <p className="text-xs text-emerald-600">Your account is secured with a TOTP authenticator app.</p>
                    </div>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center max-w-sm">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg mb-4" dangerouslySetInnerHTML={{ __html: qrCodeUrl }} />
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4">Scan this QR code with your authenticator app, then enter the 6-digit code below to verify.</p>
                    <form onSubmit={handleVerify2FA} className="w-full space-y-3">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="000000"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-center font-mono tracking-widest focus:ring-2 focus:ring-black"
                      />
                      <button type="submit" disabled={isLoading} className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-black disabled:opacity-50">
                        {isLoading ? 'Verifying...' : 'Verify & Enable'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <button onClick={handleEnroll2FA} disabled={isLoading} className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-black disabled:opacity-50 inline-flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> {isLoading ? 'Setting up...' : 'Setup Authenticator App'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Active Sessions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Devices currently logged into your account.</p>
                <div className="space-y-3">
                  {sessions.map((s, i) => (
                    <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Current Device</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{s.device}</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">ACTIVE NOW</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 mt-4">Note: Logging out from the main menu will terminate your active session.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

