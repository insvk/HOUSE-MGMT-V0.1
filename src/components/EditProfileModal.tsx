import React, { useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Save, Home, Shield, IndianRupee } from 'lucide-react';

interface EditProfileModalProps {
  currentUser: User;
  onSave: (updatedUser: Partial<User>) => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ currentUser, onSave, onClose }) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '');

  const isRentPaid = currentUser.paymentStatus === 'paid';
  const isRentPending = currentUser.paymentStatus === 'pending';
  const isMaintPaid = currentUser.maintenanceStatus === 'paid';
  const isMaintPending = currentUser.maintenanceStatus === 'pending';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      fullName,
      username: username.trim().toLowerCase(),
      phone,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#405189]" /> Resident Profile & Credentials
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official Status Card in Profile */}
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#405189]/10 text-[#405189]">
                <Home className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentUser.flatNumber}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{currentUser.role}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700" title={currentUser.id}>
                ID: {currentUser.id.length > 12 ? `${currentUser.id.substring(0, 8)}...` : currentUser.id}
              </span>
            </div>
          </div>

          {/* Dual Financial Clearance Badges */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> Monthly Rent
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                  â‚¹{currentUser.rentAmount?.toLocaleString('en-IN') || '14,000'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  isRentPaid ? 'bg-emerald-100 text-emerald-800' :
                  isRentPending ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {currentUser.paymentStatus || 'unpaid'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Maintenance
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Per-flat share
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  isMaintPaid ? 'bg-emerald-100 text-emerald-800' :
                  isMaintPending ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {currentUser.maintenanceStatus || 'unpaid'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-medium">@</span>
              <input
                type="text"
                value={username.replace('@', '')}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">You can use this username to log in.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#405189] hover:bg-[#364473] active:bg-[#2b365d] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

