import React, { useState, useRef } from 'react';
import { User, UserRole, AVAILABLE_FLATS } from '../types';
import { DEFAULT_AVATARS, compressAndResizeImage, getInitialsAvatar } from '../utils/imageUtils';
import { AvatarUploadModal } from './AvatarUploadModal';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Home, 
  Shield, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  IndianRupee, 
  Calendar, 
  PhoneCall, 
  Search, 
  Filter, 
  SlidersHorizontal,
  Wallet,
  Clock,
  FileSpreadsheet,
  FileText,
  Download,
  Camera,
  UploadCloud,
  RotateCcw
} from 'lucide-react';
import { exportTenantsToExcel, exportTenantsToPDF } from '../utils/exportUtils';
import { playSuccessChime } from '../utils/audioUtils';

interface TenantDirectoryProps {
  users: User[];
  currentUserRole: UserRole;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleTenantPaymentStatus?: (userId: string) => void;
}

export const TenantDirectory: React.FC<TenantDirectoryProps> = ({
  users,
  currentUserRole,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleTenantPaymentStatus,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Tenant@123');
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [role, setRole] = useState<UserRole>('TENANT');
  const [occupancyStatus, setOccupancyStatus] = useState<'active' | 'inactive' | 'evicted'>('active');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'unpaid'>('paid');
  const [moveInDate, setMoveInDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');
  
  // Avatar & Quick Photo Management
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATARS[0].url);
  const [showModalAvatarPresets, setShowModalAvatarPresets] = useState(false);
  const [quickAvatarUser, setQuickAvatarUser] = useState<User | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const handleModalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 260, 0.85);
      setAvatarUrl(compressed);
    } catch (err: any) {
      alert(err.message || 'Failed to process image');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('Tenant@123');
    setPhone('');
    setFlatNumber(AVAILABLE_FLATS[0]);
    setRole('TENANT');
    setOccupancyStatus('active');
    setPaymentStatus('paid');
    setAvatarUrl(DEFAULT_AVATARS[0].url);
    setShowModalAvatarPresets(false);
    setMoveInDate(new Date().toISOString().split('T')[0]);
    setRentAmount('14000');
    setDepositAmount('70000');
    setEmergencyContact('');
    setNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword(user.password || 'Tenant@123');
    setPhone(user.phone);
    setFlatNumber(user.flatNumber);
    setRole(user.role);
    setOccupancyStatus(user.occupancyStatus);
    setPaymentStatus(user.paymentStatus || 'paid');
    setAvatarUrl(user.avatarUrl || DEFAULT_AVATARS[0].url);
    setShowModalAvatarPresets(false);
    setMoveInDate(user.moveInDate || '');
    setRentAmount(user.rentAmount ? user.rentAmount.toString() : '');
    setDepositAmount(user.depositAmount ? user.depositAmount.toString() : '');
    setEmergencyContact(user.emergencyContact || '');
    setNotes(user.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !flatNumber) return;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        fullName,
        email: email.trim().toLowerCase(),
        password: password || editingUser.password || 'Tenant@123',
        phone,
        flatNumber,
        role,
        avatarUrl,
        occupancyStatus,
        paymentStatus,
        moveInDate,
        rentAmount: rentAmount ? parseFloat(rentAmount) : 0,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
        emergencyContact,
        notes,
      });
    } else {
      onAddUser({
        fullName,
        email: email.trim().toLowerCase(),
        password: password || 'Tenant@123',
        phone,
        flatNumber,
        role,
        avatarUrl,
        occupancyStatus,
        paymentStatus,
        moveInDate: moveInDate || new Date().toISOString().split('T')[0],
        rentAmount: rentAmount ? parseFloat(rentAmount) : 0,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
        emergencyContact,
        notes,
      });
    }

    setShowAddModal(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.flatNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || u.occupancyStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="velzon-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#405189]" /> Tenant Directory & Occupant Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Resident contact records, rent/deposit ledger & role privileges
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="velzon-input pl-8 pr-3 py-1.5 text-xs text-slate-700 w-full sm:w-48 sm:focus:w-60 transition-all"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="evicted">Evicted</option>
            </select>
          </div>

          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
            <button
              onClick={openAddModal}
              className="px-3.5 py-1.5 bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Occupant
            </button>
          )}

          <button
            onClick={() => {
              exportTenantsToExcel(users);
              playSuccessChime();
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Download complete resident roster & rent/deposit ledger as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0ab39c]" /> Excel
          </button>

          <button
            onClick={() => {
              exportTenantsToPDF(users);
              playSuccessChime();
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Download official resident occupancy directory as PDF (.pdf)"
          >
            <FileText className="w-4 h-4 text-[#f06548]" /> PDF
          </button>
        </div>
      </div>

      {/* Velzon Tenant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isPaid = user.paymentStatus === 'paid';
          const isPending = user.paymentStatus === 'pending';

          return (
            <div 
              key={user.id} 
              className="velzon-card p-4 flex flex-col justify-between"
            >
              <div>
                {/* Header Info with Avatar */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative group/avatar shrink-0">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={user.fullName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                      />
                      {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickAvatarUser(user);
                          }}
                          className="absolute -bottom-1 -right-1 p-1 bg-[#405189] text-white rounded-full shadow hover:bg-[#364473] transition-transform hover:scale-110 cursor-pointer"
                          title="Change Profile Picture"
                        >
                          <Camera className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">
                        {user.fullName}
                      </h3>
                      <div className="text-[11px] text-[#405189] font-semibold flex items-center gap-1 mt-0.5">
                        <Home className="w-3 h-3" /> {user.flatNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      user.role === 'OWNER' ? 'bg-[#405189]/10 text-[#405189]' :
                      user.role === 'ADMIN_TENANT' ? 'bg-[#299cdb]/10 text-[#299cdb]' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role}
                    </span>

                    <button
                      onClick={() => onToggleTenantPaymentStatus && onToggleTenantPaymentStatus(user.id)}
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        isPaid ? 'bg-[#0ab39c]/10 text-[#0ab39c]' :
                        isPending ? 'bg-[#f7b84b]/10 text-[#f7b84b]' :
                        'bg-[#f06548]/10 text-[#f06548]'
                      }`}
                      title="Toggle payment status"
                    >
                      {user.paymentStatus || 'unpaid'}
                    </button>
                  </div>
                </div>

                {/* Details list */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[160px]" title={user.email}>{user.email}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone:</span>
                    <span className="font-medium text-slate-800">{user.phone || 'N/A'}</span>
                  </div>

                  {user.rentAmount ? (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Rent / mo:</span>
                      <span className="font-bold text-[#0ab39c]">₹{user.rentAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ) : null}

                  {user.emergencyContact && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5" /> Emergency:</span>
                      <span className="text-slate-700">{user.emergencyContact}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Portal Login:</span>
                    <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {user.password ? 'Password Protected' : 'Active'}
                    </span>
                  </div>

                  {user.notes && (
                    <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-600 mt-2">
                      <strong className="text-slate-700">Notes:</strong> {user.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#405189]" /> Edit Profile
                  </button>

                  {currentUserRole === 'OWNER' && user.role !== 'OWNER' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove tenant ${user.fullName}?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-500 text-xs"
                      title="Delete Tenant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#405189]" />
                {editingUser ? `Edit Profile - ${editingUser.fullName}` : 'Add New Resident Profile'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              {/* Resident Profile Picture Picker */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="relative group shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Tenant Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#405189] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-[#405189] text-white rounded-full shadow hover:bg-[#364473] transition-transform hover:scale-110 cursor-pointer"
                      title="Upload Photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase">Tenant Profile Photo (PFP)</span>
                      <button
                        type="button"
                        onClick={() => setShowModalAvatarPresets(!showModalAvatarPresets)}
                        className="text-[11px] font-semibold text-[#405189] hover:underline cursor-pointer"
                      >
                        {showModalAvatarPresets ? 'Hide Presets' : 'Choose Preset'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Upload custom picture or select a preset portrait</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#405189] text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <UploadCloud className="w-3 h-3 text-[#405189]" /> Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(getInitialsAvatar(fullName || 'User'))}
                        className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                      >
                        Initials
                      </button>
                    </div>
                  </div>
                </div>

                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleModalPhotoUpload}
                  className="hidden"
                />

                {showModalAvatarPresets && (
                  <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Preset Portraits:</div>
                    <div className="grid grid-cols-4 gap-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(av.url);
                            setShowModalAvatarPresets(false);
                          }}
                          className={`p-0.5 rounded-lg border-2 transition-all cursor-pointer ${
                            avatarUrl === av.url ? 'border-[#405189] scale-105 shadow' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-full aspect-square rounded-md object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Sundaram"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="resident@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Password@123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flat / Unit Number *</label>
                  <select
                    required
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs font-medium"
                  >
                    <option value="">Select Flat / Unit...</option>
                    {AVAILABLE_FLATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="Owner Suite">Owner Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98421 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Role Privilege</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full velzon-input px-2.5 py-2 text-xs"
                  >
                    <option value="TENANT">Regular Tenant</option>
                    <option value="ADMIN_TENANT">Admin Tenant</option>
                    <option value="OWNER">House Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Occupancy</label>
                  <select
                    value={occupancyStatus}
                    onChange={(e) => setOccupancyStatus(e.target.value as any)}
                    className="w-full velzon-input px-2.5 py-2 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="evicted">Evicted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full velzon-input px-2.5 py-2 text-xs font-bold"
                  >
                    <option value="paid">Paid (100%)</option>
                    <option value="pending">Pending</option>
                    <option value="unpaid">Unpaid (0%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="14000"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="70000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Move In Date</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="+91 98421 99999"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Special conditions or notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full velzon-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold shadow-sm"
                >
                  {editingUser ? 'Save Profile' : 'Create Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Avatar Upload Modal (Triggered by clicking camera icon on any resident card) */}
      {quickAvatarUser && (
        <AvatarUploadModal
          isOpen={!!quickAvatarUser}
          onClose={() => setQuickAvatarUser(null)}
          currentAvatarUrl={quickAvatarUser.avatarUrl}
          userName={quickAvatarUser.fullName}
          userEmail={quickAvatarUser.email}
          onSaveAvatar={(newAvatar) => {
            onUpdateUser({ ...quickAvatarUser, avatarUrl: newAvatar });
            setQuickAvatarUser(null);
          }}
        />
      )}
    </div>
  );
};
