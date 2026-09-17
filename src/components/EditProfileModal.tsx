import React, { useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Save } from 'lucide-react';

interface EditProfileModalProps {
  currentUser: User;
  onSave: (updatedUser: Partial<User>) => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ currentUser, onSave, onClose }) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '');

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
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#405189]" /> Edit My Profile
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-medium">@</span>
              <input
                type="text"
                value={username.replace('@', '')}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">You can use this username to log in.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
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
