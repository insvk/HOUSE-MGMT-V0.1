import React, { useState, useRef } from 'react';
import { House, UserRole, User, MaintenanceRecord, Invoice, NotificationLog, AuditLog } from '../types';
import { 
  Settings, 
  Building2, 
  Shield, 
  Key, 
  Bell, 
  Save, 
  X, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { isAudioEnabled, setAudioEnabled, playSuccessChime, playWarningChime } from '../utils/audioUtils';
import { cloudDb, isSupabaseConfigured } from '../lib/supabaseClient';

interface SettingsModalProps {
  house: House;
  currentUserRole: UserRole;
  users: User[];
  records: MaintenanceRecord[];
  invoices: Invoice[];
  notificationLogs: NotificationLog[];
  auditLogs: AuditLog[];
  onClose: () => void;
  onUpdateHouse: (updated: House) => void;
  onRestoreSystemBackup?: (data: {
    house?: House;
    users?: User[];
    records?: MaintenanceRecord[];
    invoices?: Invoice[];
    notificationLogs?: NotificationLog[];
    auditLogs?: AuditLog[];
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  house,
  currentUserRole,
  users,
  records,
  invoices,
  notificationLogs,
  auditLogs,
  onClose,
  onUpdateHouse,
  onRestoreSystemBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cloud' | 'backup'>('general');
  const [name, setName] = useState(house.name);
  const [address, setAddress] = useState(house.address);
  const [city, setCity] = useState(house.city);
  const [postalCode, setPostalCode] = useState(house.postalCode || '625001');
  const [totalUnits, setTotalUnits] = useState(house.totalUnits.toString());
  const [audioEnabled, setAudioState] = useState(isAudioEnabled());

  // Cloud DB testing state
  const [testingCloud, setTestingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // File restore ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreMessage, setRestoreMessage] = useState('');

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioState(next);
    setAudioEnabled(next);
    if (next) playSuccessChime();
  };

  const handleSaveGeneral = () => {
    onUpdateHouse({
      ...house,
      name,
      address,
      city,
      postalCode,
      totalUnits: parseInt(totalUnits) || 6,
    });
    playSuccessChime();
    onClose();
  };

  const handleTestCloudDb = async () => {
    setTestingCloud(true);
    setCloudStatus(null);
    const start = performance.now();
    const res = await cloudDb.testConnection();
    const duration = Math.round(performance.now() - start);
    setTestingCloud(false);
    setCloudStatus({
      connected: res.connected,
      message: `${res.message} (${duration}ms latency)`,
    });
    if (res.connected) {
      playSuccessChime();
    } else {
      playWarningChime();
    }
  };

  // Full Database Backup Export
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      platform: 'MADURA HOUSE MAINTENANCE MGMT V0.1',
      house: { ...house, name, address, city, postalCode, totalUnits: parseInt(totalUnits) || 6 },
      users,
      records,
      invoices,
      notificationLogs,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MaduraHouse_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccessChime();
  };

  // Restore from Backup
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.users || !json.records) {
          throw new Error('Invalid backup schema: Missing core data tables.');
        }

        if (onRestoreSystemBackup) {
          onRestoreSystemBackup(json);
          playSuccessChime();
          setRestoreMessage(`Successfully restored ${json.users.length} users and ${json.records.length} billing records!`);
        }
      } catch (err: any) {
        playWarningChime();
        setRestoreMessage(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#405189]/10 text-[#405189] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Property & Platform Settings</h3>
              <p className="text-[11px] text-slate-500">Enterprise configuration for Madura House</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-5 pt-2 gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'general' ? 'border-[#405189] text-[#405189]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Property Details
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'cloud' ? 'border-[#405189] text-[#405189]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cloud DB & Audio
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'backup' ? 'border-[#405189] text-[#405189]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Backup & Restore
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          
          {/* TAB 1: General Property Details */}
          {activeTab === 'general' && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Property Name</label>
                <input
                  type="text"
                  disabled={currentUserRole !== 'OWNER'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full velzon-input px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Street Address</label>
                <input
                  type="text"
                  disabled={currentUserRole !== 'OWNER'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full velzon-input px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-500 mb-1">City</label>
                  <input
                    type="text"
                    disabled={currentUserRole !== 'OWNER'}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-500 mb-1">Postal Code</label>
                  <input
                    type="text"
                    disabled={currentUserRole !== 'OWNER'}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Total Residential Units</label>
                <input
                  type="number"
                  disabled={currentUserRole !== 'OWNER'}
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  className="w-full velzon-input px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="text-[#405189] font-bold">PROPERTY ADMIN CREDENTIALS:</div>
                <div>Email: <span className="text-slate-900 font-bold">sampathkumar@chemadur.com</span></div>
                <div>Role: <span className="text-[#0ab39c] font-bold">OWNER (Super Admin)</span></div>
              </div>
            </div>
          )}

          {/* TAB 2: Cloud DB & Audio */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Audio Settings */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    {audioEnabled ? <Volume2 className="w-4 h-4 text-[#0ab39c]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    Synthesized Audio Chimes
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Subtle audio feedback on invoice downloads, payments & additions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    audioEnabled ? 'bg-[#0ab39c]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      audioEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Cloud DB Connection Status */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[#405189]" /> Cloud PostgreSQL Sync
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isSupabaseConfigured
                        ? 'Live Cloud DB environment variables detected in .env'
                        : 'Operating in Local Encrypted Vault mode'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                    isSupabaseConfigured ? 'bg-[#0ab39c]/10 text-[#0ab39c]' : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {isSupabaseConfigured ? 'Cloud Configured' : 'Offline Mode'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={testingCloud}
                  onClick={handleTestCloudDb}
                  className="w-full py-2 px-3 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingCloud ? 'animate-spin' : ''}`} />
                  {testingCloud ? 'Testing Connection...' : 'Test Cloud Connection & Latency'}
                </button>

                {cloudStatus && (
                  <div className={`p-2.5 rounded text-[11px] font-mono flex items-start gap-1.5 ${
                    cloudStatus.connected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {cloudStatus.connected ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                    <span>{cloudStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#405189]" /> Export Full Platform Snapshot
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Download an immutable JSON archive of all property metadata, verified tenants, itemized maintenance expenses, invoice links, and audit trails.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-1.5 rounded bg-[#405189] hover:bg-[#364574] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer mt-2 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download JSON Backup
                </button>
              </div>

              {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#0ab39c]" /> Restore Platform from Backup
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Upload a previously generated JSON backup to restore complete property states.
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer mt-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0ab39c]" /> Select JSON File to Restore
                  </button>

                  {restoreMessage && (
                    <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-[11px] font-mono border border-emerald-200 mt-2">
                      {restoreMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          {activeTab === 'general' && currentUserRole === 'OWNER' ? (
            <button
              onClick={handleSaveGeneral}
              className="px-4 py-1.5 rounded bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
