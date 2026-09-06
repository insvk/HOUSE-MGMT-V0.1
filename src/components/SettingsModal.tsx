import React from 'react';
import { House, UserRole } from '../types';
import { Settings, Building2, Shield, Key, Bell, Save, X } from 'lucide-react';

interface SettingsModalProps {
  house: House;
  currentUserRole: UserRole;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ house, currentUserRole, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#405189]/10 text-[#405189] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Property & Platform Settings</h3>
              <p className="text-[11px] text-slate-500">Configuration for Madura House</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs text-slate-700">
          <div>
            <label className="block font-semibold uppercase text-slate-500 mb-1">Property Name</label>
            <input
              type="text"
              readOnly={currentUserRole !== 'OWNER'}
              defaultValue={house.name}
              className="w-full velzon-input px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-500 mb-1">Address</label>
            <input
              type="text"
              readOnly={currentUserRole !== 'OWNER'}
              defaultValue={house.address}
              className="w-full velzon-input px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-slate-500 mb-1">City</label>
              <input
                type="text"
                readOnly={currentUserRole !== 'OWNER'}
                defaultValue={house.city}
                className="w-full velzon-input px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-500 mb-1">Total Flat Units</label>
              <input
                type="number"
                readOnly={currentUserRole !== 'OWNER'}
                defaultValue={house.totalUnits}
                className="w-full velzon-input px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
            <div className="text-[#405189] font-bold">PROPERTY ADMIN CREDENTIALS:</div>
            <div>Email: <span className="text-slate-900 font-bold">sampathkumar@chemadur.com</span></div>
            <div>Role: <span className="text-[#0ab39c] font-bold">OWNER (Super Admin)</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" /> Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
