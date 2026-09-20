import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  UploadCloud, 
  Check, 
  Sparkles, 
  Link as LinkIcon, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { DEFAULT_AVATARS, compressAndResizeImage, getInitialsAvatar } from '../utils/imageUtils';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  userName: string;
  userEmail: string;
  onSaveAvatar: (newAvatarUrl: string) => Promise<void> | void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  userEmail,
  onSaveAvatar,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentAvatarUrl || DEFAULT_AVATARS[0].url
  );
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setIsProcessing(true);

    try {
      // Auto resize & crop to high-resolution square base64 JPEG/WebP
      const compressed = await compressAndResizeImage(file, 280, 0.88);
      setSelectedAvatar(compressed);
      setSuccessMessage('Photo processed and ready to save!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process selected image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    setSelectedAvatar(customUrlInput.trim());
    setSuccessMessage('Image URL applied to preview!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResetToInitials = () => {
    const initialsUrl = getInitialsAvatar(userName || 'User');
    setSelectedAvatar(initialsUrl);
    setSuccessMessage('Reset to initials avatar!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSave = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await onSaveAvatar(selectedAvatar);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile picture.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#405189] to-[#364473] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-snug">Update Profile Picture</h2>
              <p className="text-xs text-white/80">{userName} • {userEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Preview Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <img 
                src={selectedAvatar} 
                alt={userName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#405189]/20 shadow-md transition-transform group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#405189] text-white rounded-full shadow-lg hover:bg-[#364473] transition-transform hover:scale-110 cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs font-semibold text-slate-700">Live Preview</span>
              <p className="text-[11px] text-slate-400">Syncs immediately to your account and cloud profile</p>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'presets' 
                  ? 'border-[#405189] text-[#405189]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Preset Avatars
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'upload' 
                  ? 'border-[#405189] text-[#405189]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'url' 
                  ? 'border-[#405189] text-[#405189]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Web Link
            </button>
          </div>

          {/* Tab 1: Presets Gallery */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Choose a professional portrait:</span>
                <button
                  type="button"
                  onClick={handleResetToInitials}
                  className="text-[11px] text-[#405189] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Use Initials
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {DEFAULT_AVATARS.map((avatar) => {
                  const isChosen = selectedAvatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`relative rounded-xl overflow-hidden p-1 border-2 transition-all cursor-pointer group ${
                        isChosen 
                          ? 'border-[#405189] ring-2 ring-[#405189]/30 scale-105 shadow-md' 
                          : 'border-slate-200 hover:border-slate-300 hover:scale-102'
                      }`}
                    >
                      <img 
                        src={avatar.url} 
                        alt={avatar.label}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      {isChosen && (
                        <div className="absolute inset-0 bg-[#405189]/25 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-[#405189] text-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#405189] bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
              >
                <div className="p-3 bg-white rounded-full shadow-sm text-slate-500 group-hover:text-[#405189] group-hover:scale-110 transition-all mb-2.5">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-700 group-hover:text-[#405189]">
                  Click to select photo from device
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG, WEBP • Automatically square-cropped & optimized
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Custom Web URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Paste Image Web Address (URL)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#405189]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                You can paste a direct public image link (e.g. from Google Drive public URL, Unsplash, or Imgur).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToInitials}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Reset to Initials
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-2 bg-[#405189] hover:bg-[#364473] text-white text-xs font-bold rounded-lg transition-all shadow hover:shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Picture</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
