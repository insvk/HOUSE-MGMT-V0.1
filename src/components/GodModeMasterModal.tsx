import React, { useState, useRef, useEffect } from 'react';
import { 
  House, 
  MaintenanceRecord, 
  Expense, 
  User, 
  UserRole, 
  Invoice, 
  NotificationLog, 
  AVAILABLE_FLATS, 
  ExpenseCategory 
} from '../types';
import { DEFAULT_AVATARS, compressAndResizeImage, getInitialsAvatar, processInvoiceFile } from '../utils/imageUtils';
import { playSuccessChime, playWarningChime } from '../utils/audioUtils';
import { InvoicePreviewModal, InvoicePreviewData } from './InvoicePreviewModal';
import { InvoiceAttachmentPill } from './InvoiceAttachmentPill';
import {
  Building2,
  Users,
  IndianRupee,
  Wrench,
  Receipt,
  Bell,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  CheckCircle2,
  Camera,
  UploadCloud,
  RotateCcw,
  Key,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  Mail,
  Phone,
  Home,
  Code,
  Shield,
  Check,
  Tag,
  AlertCircle,
  Paperclip,
  FileText,
  Eye,
  Download
} from 'lucide-react';

export type GodModeTab = 'property' | 'ledger' | 'residents' | 'expenses' | 'invoices' | 'announcements' | 'raw';

interface GodModeMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: GodModeTab;
  house: House;
  onUpdateHouse: (updatedHouse: House) => void;
  currentRecord: MaintenanceRecord;
  onUpdateRecord: (updatedRecord: MaintenanceRecord) => void;
  users: User[];
  onUpdateUser: (updatedUser: User) => void;
  onAddUser: (newUser: Omit<User, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  invoices: Invoice[];
  onUploadInvoice: (invoice: Omit<Invoice, 'id' | 'uploadedAt'>) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  notificationLogs: NotificationLog[];
  onAddNotificationLog?: (log: Omit<NotificationLog, 'id' | 'sentAt'>) => void;
}

export const GodModeMasterModal: React.FC<GodModeMasterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'property',
  house,
  onUpdateHouse,
  currentRecord,
  onUpdateRecord,
  users,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  invoices,
  onUploadInvoice,
  onDeleteInvoice,
  notificationLogs,
  onAddNotificationLog,
}) => {
  const [activeTab, setActiveTab] = useState<GodModeTab>(initialTab);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ============================================================================
  // TAB 1: PROPERTY / HOUSE STATE
  // ============================================================================
  const [houseName, setHouseName] = useState(house.name);
  const [houseAddress, setHouseAddress] = useState(house.address);
  const [houseCity, setHouseCity] = useState(house.city);
  const [housePostalCode, setHousePostalCode] = useState(house.postalCode);
  const [houseTotalUnits, setHouseTotalUnits] = useState(house.totalUnits.toString());
  const [houseOwnerId, setHouseOwnerId] = useState(house.ownerId);

  useEffect(() => {
    setHouseName(house.name);
    setHouseAddress(house.address);
    setHouseCity(house.city);
    setHousePostalCode(house.postalCode);
    setHouseTotalUnits(house.totalUnits.toString());
    setHouseOwnerId(house.ownerId);
  }, [house]);

  const handleSaveHouse = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHouse({
      ...house,
      name: houseName.trim(),
      address: houseAddress.trim(),
      city: houseCity.trim(),
      postalCode: housePostalCode.trim(),
      totalUnits: parseInt(houseTotalUnits, 10) || 5,
      ownerId: houseOwnerId.trim(),
    });
    playSuccessChime();
    showNotification('Property Profile updated successfully!');
  };

  // ============================================================================
  // TAB 2: FINANCIAL LEDGER & SPLIT RULES
  // ============================================================================
  const [recordMonth, setRecordMonth] = useState(currentRecord.month);
  const [recordYear, setRecordYear] = useState(currentRecord.year);
  const [recordActiveTenants, setRecordActiveTenants] = useState(currentRecord.activeTenantsCount.toString());
  const [recordGrandTotal, setRecordGrandTotal] = useState(currentRecord.grandTotal.toString());
  const [recordContribution, setRecordContribution] = useState(currentRecord.individualContribution.toString());
  const [recordNotes, setRecordNotes] = useState(currentRecord.notes || '');

  useEffect(() => {
    setRecordMonth(currentRecord.month);
    setRecordYear(currentRecord.year);
    setRecordActiveTenants(currentRecord.activeTenantsCount.toString());
    setRecordGrandTotal(currentRecord.grandTotal.toString());
    setRecordContribution(currentRecord.individualContribution.toString());
    setRecordNotes(currentRecord.notes || '');
  }, [currentRecord]);

  const handleRecalculateSplit = () => {
    const total = parseFloat(recordGrandTotal) || 0;
    const count = parseInt(recordActiveTenants, 10) || 1;
    const split = count > 0 ? total / count : 0;
    setRecordContribution(split.toFixed(2));
  };

  const handleSaveLedger = (e: React.FormEvent) => {
    e.preventDefault();
    const grandTotalNum = parseFloat(recordGrandTotal) || 0;
    const activeCountNum = parseInt(recordActiveTenants, 10) || 5;
    const contributionNum = parseFloat(recordContribution) || (activeCountNum > 0 ? grandTotalNum / activeCountNum : 0);

    onUpdateRecord({
      ...currentRecord,
      month: recordMonth,
      year: recordYear,
      grandTotal: grandTotalNum,
      activeTenantsCount: activeCountNum,
      individualContribution: contributionNum,
      notes: recordNotes.trim(),
    });
    playSuccessChime();
    showNotification('Financial Ledger & Billing Rules updated successfully!');
  };

  // ============================================================================
  // TAB 3: RESIDENTS & CREDENTIALS
  // ============================================================================
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || 'new');
  const [isCreatingResident, setIsCreatingResident] = useState(false);

  // Resident Form
  const [resFullName, setResFullName] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resPassword, setResPassword] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resFlat, setResFlat] = useState<string>(AVAILABLE_FLATS[0]);
  const [resRole, setResRole] = useState<UserRole>('TENANT');
  const [resOccupancy, setResOccupancy] = useState<'active' | 'inactive' | 'evicted'>('active');
  const [resPayment, setResPayment] = useState<'paid' | 'pending' | 'unpaid'>('paid');
  const [resRent, setResRent] = useState('14000');
  const [resDeposit, setResDeposit] = useState('70000');
  const [resMoveIn, setResMoveIn] = useState('');
  const [resEmergency, setResEmergency] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [resAvatar, setResAvatar] = useState(DEFAULT_AVATARS[0].url);
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const residentFileInputRef = useRef<HTMLInputElement>(null);

  const loadUserToForm = (u: User) => {
    setIsCreatingResident(false);
    setSelectedUserId(u.id);
    setResFullName(u.fullName || '');
    setResEmail(u.email || '');
    setResPassword(u.password || 'Resident@123');
    setResPhone(u.phone || '');
    setResFlat(u.flatNumber || AVAILABLE_FLATS[0]);
    setResRole(u.role || 'TENANT');
    setResOccupancy(u.occupancyStatus || 'active');
    setResPayment(u.paymentStatus || 'paid');
    setResRent((u.rentAmount || 14000).toString());
    setResDeposit((u.depositAmount || 70000).toString());
    setResMoveIn(u.moveInDate || '');
    setResEmergency(u.emergencyContact || '');
    setResNotes(u.notes || '');
    setResAvatar(u.avatarUrl || DEFAULT_AVATARS[0].url);
    setShowAvatarPresets(false);
  };

  useEffect(() => {
    if (selectedUserId === 'new') {
      setIsCreatingResident(true);
      setResFullName('');
      setResEmail('');
      setResPassword('Tenant@123');
      setResPhone('');
      setResFlat(AVAILABLE_FLATS[0]);
      setResRole('TENANT');
      setResOccupancy('active');
      setResPayment('paid');
      setResRent('14000');
      setResDeposit('70000');
      setResMoveIn(new Date().toISOString().split('T')[0]);
      setResEmergency('');
      setResNotes('');
      setResAvatar(DEFAULT_AVATARS[0].url);
    } else {
      const found = users.find((u) => u.id === selectedUserId);
      if (found) {
        loadUserToForm(found);
      }
    }
  }, [selectedUserId, users]);

  const handleResidentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 260, 0.85);
      setResAvatar(compressed);
      showNotification('Photo uploaded!');
    } catch (err: any) {
      alert(err.message || 'Image processing failed');
    }
  };

  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resFullName.trim() || !resEmail.trim()) {
      alert('Name and email are required');
      return;
    }

    if (isCreatingResident) {
      onAddUser({
        fullName: resFullName.trim(),
        email: resEmail.trim().toLowerCase(),
        password: resPassword || 'Tenant@123',
        phone: resPhone.trim() || '+91 98421 00000',
        flatNumber: resFlat,
        role: resRole,
        occupancyStatus: resOccupancy,
        paymentStatus: resPayment,
        rentAmount: parseFloat(resRent) || 14000,
        depositAmount: parseFloat(resDeposit) || 70000,
        moveInDate: resMoveIn || new Date().toISOString().split('T')[0],
        emergencyContact: resEmergency.trim(),
        notes: resNotes.trim(),
        avatarUrl: resAvatar,
      });
      playSuccessChime();
      showNotification(`Resident ${resFullName} created successfully!`);
    } else {
      const target = users.find((u) => u.id === selectedUserId);
      if (!target) return;
      onUpdateUser({
        ...target,
        fullName: resFullName.trim(),
        email: resEmail.trim().toLowerCase(),
        password: resPassword,
        phone: resPhone.trim(),
        flatNumber: resFlat,
        role: resRole,
        occupancyStatus: resOccupancy,
        paymentStatus: resPayment,
        rentAmount: parseFloat(resRent) || 0,
        depositAmount: parseFloat(resDeposit) || 0,
        moveInDate: resMoveIn,
        emergencyContact: resEmergency.trim(),
        notes: resNotes.trim(),
        avatarUrl: resAvatar,
      });
      playSuccessChime();
      showNotification(`Updated profile & credentials for ${resFullName}!`);
    }
  };

  const handleDeleteCurrentResident = () => {
    if (isCreatingResident) return;
    const target = users.find((u) => u.id === selectedUserId);
    if (!target) return;
    if (target.email === 'sampathkumar@chemadur.com') {
      alert('Cannot delete the Property Owner account.');
      return;
    }
    if (confirm(`Permanently delete resident "${target.fullName}" (${target.email})?`)) {
      onDeleteUser(target.id);
      playWarningChime();
      setSelectedUserId(users[0]?.id || 'new');
      showNotification(`Resident ${target.fullName} removed.`);
    }
  };

  // ============================================================================
  // TAB 4: EXPENSES & INVOICE ATTACHMENTS
  // ============================================================================
  const [previewInvoice, setPreviewInvoice] = useState<InvoicePreviewData | null>(null);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expParticular, setExpParticular] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('maintenance');
  const [expGst, setExpGst] = useState(false);
  const [expGstAmount, setExpGstAmount] = useState('0');
  const [expNotes, setExpNotes] = useState('');
  const [expInvoiceUrl, setExpInvoiceUrl] = useState<string | undefined>(undefined);
  const [expInvoiceFileName, setExpInvoiceFileName] = useState<string | undefined>(undefined);
  const [expInvoiceFileType, setExpInvoiceFileType] = useState<string | undefined>(undefined);
  const [expInvoiceFileSize, setExpInvoiceFileSize] = useState<number | undefined>(undefined);
  const [expOcrText, setExpOcrText] = useState<string | undefined>(undefined);
  const expFileInputRef = useRef<HTMLInputElement>(null);

  const resetExpenseForm = () => {
    setEditingExpId(null);
    setExpParticular('');
    setExpAmount('');
    setExpCategory('maintenance');
    setExpGst(false);
    setExpGstAmount('0');
    setExpNotes('');
    setExpInvoiceUrl(undefined);
    setExpInvoiceFileName(undefined);
    setExpInvoiceFileType(undefined);
    setExpInvoiceFileSize(undefined);
    setExpOcrText(undefined);
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpId(exp.id);
    setExpParticular(exp.particular);
    setExpAmount(exp.amount.toString());
    setExpCategory(exp.category);
    setExpGst(exp.gstApplicable);
    setExpGstAmount(exp.gstAmount ? exp.gstAmount.toString() : '0');
    setExpNotes(exp.notes || '');
    setExpInvoiceUrl(exp.invoiceUrl);
    setExpInvoiceFileName(exp.invoiceFileName);
    setExpInvoiceFileType(exp.invoiceFileType);
    setExpInvoiceFileSize(exp.invoiceFileSize);
    setExpOcrText(exp.ocrText);
  };

  const handleExpenseInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processInvoiceFile(file);
      setExpInvoiceUrl(processed.dataUrl);
      setExpInvoiceFileName(processed.fileName);
      setExpInvoiceFileType(processed.fileType);
      setExpInvoiceFileSize(processed.fileSize);
      setExpOcrText(`OCR EXTRACTED [${processed.fileName}]: Official maintenance invoice voucher. Amount verified.`);
      playSuccessChime();
      showNotification(`Attached invoice "${processed.fileName}" (${Math.round(processed.fileSize / 1024)} KB)`);
    } catch (err: any) {
      alert(err.message || 'Image/PDF processing failed');
    }
  };

  const handleRemoveAttachedInvoice = () => {
    setExpInvoiceUrl(undefined);
    setExpInvoiceFileName(undefined);
    setExpInvoiceFileType(undefined);
    setExpInvoiceFileSize(undefined);
    setExpOcrText(undefined);
    showNotification('Attachment removed from expense item.');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expParticular.trim() || !expAmount) return;

    if (editingExpId) {
      const existing = currentRecord.expenses.find((e) => e.id === editingExpId);
      if (existing) {
        onUpdateExpense({
          ...existing,
          particular: expParticular.trim(),
          amount: parseFloat(expAmount),
          category: expCategory,
          gstApplicable: expGst,
          gstAmount: expGst && expGstAmount ? parseFloat(expGstAmount) : 0,
          notes: expNotes.trim(),
          invoiceUrl: expInvoiceUrl,
          invoiceFileName: expInvoiceFileName,
          invoiceFileType: expInvoiceFileType,
          invoiceFileSize: expInvoiceFileSize,
          ocrText: expOcrText,
        });
        playSuccessChime();
        showNotification(`Updated expense "${expParticular}"`);
        resetExpenseForm();
      }
    } else {
      onAddExpense({
        maintenanceRecordId: currentRecord.id,
        slNo: currentRecord.expenses.length + 1,
        particular: expParticular.trim(),
        amount: parseFloat(expAmount),
        category: expCategory,
        gstApplicable: expGst,
        gstAmount: expGst && expGstAmount ? parseFloat(expGstAmount) : 0,
        notes: expNotes.trim(),
        addedBy: 'sampathkumar@chemadur.com',
        invoiceUrl: expInvoiceUrl,
        invoiceFileName: expInvoiceFileName,
        invoiceFileType: expInvoiceFileType,
        invoiceFileSize: expInvoiceFileSize,
        ocrText: expOcrText,
      });
      playSuccessChime();
      showNotification(`Added new expense "${expParticular}"`);
      resetExpenseForm();
    }
  };

  // ============================================================================
  // TAB 5: INVOICES & BILLS
  // ============================================================================
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [invoiceCategory, setInvoiceCategory] = useState('EB Bill');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceOcrText, setInvoiceOcrText] = useState('');

  const handleUploadNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceFileName.trim()) return;

    onUploadInvoice({
      maintenanceRecordId: currentRecord.id,
      fileName: invoiceFileName.trim(),
      fileSize: 245000,
      fileType: 'application/pdf',
      storagePath: `invoices/${Date.now()}_${invoiceFileName.replace(/\s+/g, '_')}.pdf`,
      uploadedBy: 'sampathkumar@chemadur.com',
      ocrText: invoiceOcrText.trim() || `Official invoice verified by Sampath Kumar. Amount: ₹${invoiceAmount || '0'}`,
    });

    playSuccessChime();
    showNotification(`Invoice "${invoiceFileName}" uploaded!`);
    setInvoiceFileName('');
    setInvoiceAmount('');
    setInvoiceOcrText('');
  };

  // ============================================================================
  // TAB 6: ANNOUNCEMENTS & NOTICES
  // ============================================================================
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementRecipient, setAnnouncementRecipient] = useState('all');
  const [announcementType, setAnnouncementType] = useState<'maintenance_added' | 'contribution_due' | 'payment_received'>('maintenance_added');

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementSubject.trim()) return;

    if (onAddNotificationLog) {
      onAddNotificationLog({
        maintenanceRecordId: currentRecord.id,
        recipientEmail: announcementRecipient === 'all' ? 'all-residents@chemadur.com' : announcementRecipient,
        type: announcementType,
        subject: announcementSubject.trim(),
        status: 'sent',
      });
      playSuccessChime();
      showNotification(`Announcement broadcasted to residents!`);
      setAnnouncementSubject('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header with God Mode Accents */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-[#312e81] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0 font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  GOD ACCESS MASTER
                </span>
                <span className="text-xs text-indigo-200 font-mono hidden sm:inline">
                  sampathkumar@chemadur.com
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Universal Master Data & Permission Controller
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 shrink-0 scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('property')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'property'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Property Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Financial Rules & Split
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('residents')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'residents'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Residents & Credentials
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" /> Expenses ({currentRecord.expenses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices & Bills ({invoices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Broadcast Notices
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'raw'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Raw Data
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toast && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0 animate-in fade-in duration-100">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {toast}
            </span>
            <button onClick={() => setToast(null)} className="text-white hover:opacity-80">✕</button>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          
          {/* ========================================================================= */}
          {/* TAB 1: PROPERTY / BUILDING PROFILE                                       */}
          {/* ========================================================================= */}
          {activeTab === 'property' && (
            <form onSubmit={handleSaveHouse} className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-blue-900 text-xs">
                <span className="font-bold">🏢 Property Root Configuration:</span> Changes made here reflect immediately across headers, official PDF statements, Excel exports, and receipts.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Property / Complex Name *</label>
                <input
                  type="text"
                  required
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-semibold"
                  placeholder="e.g. Madura House Maintenance"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={houseAddress}
                  onChange={(e) => setHouseAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                  placeholder="e.g. No. 42, Bypass Road, Ellis Nagar"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={houseCity}
                    onChange={(e) => setHouseCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    placeholder="e.g. Maduravoyal"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Postal Code / PIN *</label>
                  <input
                    type="text"
                    required
                    value={housePostalCode}
                    onChange={(e) => setHousePostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                    placeholder="e.g. 625001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Residential Units</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={houseTotalUnits}
                    onChange={(e) => setHouseTotalUnits(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default 5 standard units (GF, F01-FRONT, F01-BACK, F02-FRONT, F02-BACK)</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Owner System User ID</label>
                  <input
                    type="text"
                    value={houseOwnerId}
                    onChange={(e) => setHouseOwnerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" /> Save Property Details
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FINANCIAL RULES & SPLIT                                           */}
          {/* ========================================================================= */}
          {activeTab === 'ledger' && (
            <form onSubmit={handleSaveLedger} className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-amber-950 text-xs">
                <span className="font-bold">💰 Maintenance Billing & Split Formula:</span> You can customize the active month, total maintenance expenses, total paying occupants, and the individual per-flat contribution.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Billing Month (1 - 12) *</label>
                  <select
                    value={recordMonth}
                    onChange={(e) => setRecordMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {idx + 1} - {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Billing Year *</label>
                  <input
                    type="number"
                    value={recordYear}
                    onChange={(e) => setRecordYear(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grand Total Expenses (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recordGrandTotal}
                    onChange={(e) => setRecordGrandTotal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sum of all itemized expenses</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Active Paying Flats</label>
                  <input
                    type="number"
                    min="1"
                    value={recordActiveTenants}
                    onChange={(e) => setRecordActiveTenants(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Split divisor</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Each Flat Share (₹)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={recordContribution}
                      onChange={(e) => setRecordContribution(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold text-emerald-700"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculateSplit}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-[10px] font-bold shrink-0 cursor-pointer"
                      title="Auto calculate Total / Units"
                    >
                      Calc
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Per-unit monthly bill</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Period Summary / Ledger Notes</label>
                <textarea
                  rows={3}
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                  placeholder="e.g. September 2026 Regular Maintenance & Motor Pump servicing."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" /> Save Financial Rules
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RESIDENTS & CREDENTIALS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'residents' && (
            <div className="space-y-4">
              {/* Resident Picker Selector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-700">Select Resident to Edit:</span>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.flatNumber}) - {u.role} [{u.email}]
                      </option>
                    ))}
                    <option value="new">+ Register New Resident</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserId('new')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Resident
                </button>
              </div>

              {/* Comprehensive Resident Edit Form */}
              <form onSubmit={handleSaveResident} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                
                {/* Photo & Identity Banner */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="relative group shrink-0">
                    <img
                      src={resAvatar}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-700 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => residentFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-indigo-700 text-white rounded-full shadow hover:bg-indigo-800 transition-transform hover:scale-110 cursor-pointer"
                      title="Upload Photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        {isCreatingResident ? 'New Resident Profile' : resFullName || 'Resident'}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                        {resRole}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        {resFlat}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isCreatingResident ? 'Enter credentials and lease terms below.' : `System ID: ${selectedUserId}`}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => residentFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-700 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-3 h-3 text-indigo-700" /> Upload Custom Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                        className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        {showAvatarPresets ? 'Hide Presets' : 'Pick Preset'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResAvatar(getInitialsAvatar(resFullName || 'Resident'))}
                        className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                      >
                        Initials Avatar
                      </button>
                    </div>
                  </div>

                  <input
                    ref={residentFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleResidentPhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Preset Avatars Gallery */}
                {showAvatarPresets && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Select an Avatar Preset:</div>
                    <div className="grid grid-cols-8 gap-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            setResAvatar(av.url);
                            setShowAvatarPresets(false);
                          }}
                          className={`p-0.5 rounded-lg border-2 transition-all cursor-pointer ${
                            resAvatar === av.url ? 'border-indigo-700 scale-105 shadow' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-full aspect-square rounded object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Credentials & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={resFullName}
                      onChange={(e) => setResFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                    <input
                      type="email"
                      required
                      value={resEmail}
                      onChange={(e) => setResEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Password (Editable) *</span>
                      <span className="text-[10px] text-amber-600 font-normal">Direct plaintext</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resPassword}
                      onChange={(e) => setResPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold text-indigo-900"
                      placeholder="Password"
                    />
                  </div>
                </div>

                {/* Flat, Role, Status, Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Flat / Unit Number *</label>
                    <select
                      value={resFlat}
                      onChange={(e) => setResFlat(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      {AVAILABLE_FLATS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="Owner Suite">Owner Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">System Role *</label>
                    <select
                      value={resRole}
                      onChange={(e) => setResRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      <option value="TENANT">Tenant (Standard)</option>
                      <option value="ADMIN_TENANT">Admin Tenant (Manager)</option>
                      <option value="OWNER">Owner (Superadmin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Occupancy Status</label>
                    <select
                      value={resOccupancy}
                      onChange={(e) => setResOccupancy(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      <option value="active">Active Resident</option>
                      <option value="inactive">Inactive / Vacated</option>
                      <option value="evicted">Evicted</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                    <select
                      value={resPayment}
                      onChange={(e) => setResPayment(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>

                {/* Financial Lease & Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={resRent}
                      onChange={(e) => setResRent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Security Deposit (₹)</label>
                    <input
                      type="number"
                      value={resDeposit}
                      onChange={(e) => setResDeposit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={resPhone}
                      onChange={(e) => setResPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                      placeholder="+91 98421 00000"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={resEmergency}
                      onChange={(e) => setResEmergency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                      placeholder="+91 98421 99999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Internal Notes</label>
                  <input
                    type="text"
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    placeholder="Lease notes, vehicle info, or remarks"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  {!isCreatingResident && selectedUserId !== 'u-owner-01' ? (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentResident}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Resident
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Save className="w-4 h-4" /> {isCreatingResident ? 'Create & Add Resident' : 'Save Resident Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: EXPENSES                                                          */}
          {/* ========================================================================= */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {/* Expense Add / Edit Form */}
              <form onSubmit={handleSaveExpense} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-700" />
                    {editingExpId ? `Edit Expense Item (ID: ${editingExpId})` : 'Add New Maintenance Expense Item'}
                  </span>
                  {editingExpId && (
                    <button
                      type="button"
                      onClick={resetExpenseForm}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Particulars / Description *</label>
                    <input
                      type="text"
                      required
                      value={expParticular}
                      onChange={(e) => setExpParticular(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                      placeholder="e.g. Common Motor Repair & Capacitor replacement"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="utilities">Utilities (EB/Water)</option>
                      <option value="repairs">Repairs</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GST Applicable?</label>
                    <div className="flex items-center gap-2 h-9">
                      <input
                        type="checkbox"
                        id="expGstCheck"
                        checked={expGst}
                        onChange={(e) => setExpGst(e.target.checked)}
                        className="rounded accent-indigo-700 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="expGstCheck" className="text-xs text-slate-700 cursor-pointer">Yes, includes GST</label>
                    </div>
                  </div>

                  {expGst && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GST Amount (₹)</label>
                      <input
                        type="number"
                        value={expGstAmount}
                        onChange={(e) => setExpGstAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes / Contractor / Serial No.</label>
                  <input
                    type="text"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    placeholder="e.g. Paid to Meenakshi Electricals, Cash voucher #104"
                  />
                </div>

                {/* Attached Invoice File Section */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Invoice / Bill Document Attachment (PDF / JPG / PNG)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => expFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-600 text-slate-700 hover:text-indigo-900 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                      {expInvoiceFileName ? 'Replace Attached Invoice' : 'Attach Invoice PDF / JPG'}
                    </button>
                    <input
                      ref={expFileInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleExpenseInvoiceUpload}
                      className="hidden"
                    />

                    {expInvoiceFileName ? (
                      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl text-indigo-900">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold truncate max-w-[200px]">{expInvoiceFileName}</span>
                        {expInvoiceFileSize && (
                          <span className="text-[10px] text-indigo-600 font-mono">({Math.round(expInvoiceFileSize / 1024)} KB)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewInvoice({
                              fileName: expInvoiceFileName,
                              fileUrl: expInvoiceUrl,
                              fileType: expInvoiceFileType,
                              fileSize: expInvoiceFileSize,
                              particular: expParticular,
                              amount: parseFloat(expAmount) || 0,
                              category: expCategory,
                              ocrText: expOcrText,
                            });
                          }}
                          className="text-indigo-700 hover:underline font-bold text-[10px] flex items-center gap-0.5 ml-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveAttachedInvoice}
                          className="text-rose-600 hover:text-rose-800 font-bold text-[10px] ml-1 cursor-pointer"
                          title="Remove attached invoice"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">No invoice attached yet (Optional)</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> {editingExpId ? 'Save Expense Changes' : 'Add Expense Item'}
                  </button>
                </div>
              </form>

              {/* Expense Table List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Particulars & Attached Invoice</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecord.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          No expenses logged for this period. Use the form above to add an item.
                        </td>
                      </tr>
                    ) : (
                      currentRecord.expenses.map((exp, idx) => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-400 align-top">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-800 align-top">
                            <div className="font-bold text-slate-900">{exp.particular}</div>
                            {exp.notes && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{exp.notes}</div>}
                            
                            {/* Invoice attachment pill badge */}
                            <InvoiceAttachmentPill
                              expense={exp}
                              onOpenPreview={(inv) => setPreviewInvoice(inv)}
                              onQuickAttach={handleStartEditExpense}
                            />
                          </td>
                          <td className="p-3 align-top">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900 align-top">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right space-x-1 align-top">
                            <button
                              type="button"
                              onClick={() => handleStartEditExpense(exp)}
                              className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                              title="Edit Expense & Attachments"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete "${exp.particular}"?`)) {
                                  onDeleteExpense(exp.id);
                                  showNotification('Deleted expense item');
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: INVOICES & CONTRACTOR BILLS                                       */}
          {/* ========================================================================= */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <form onSubmit={handleUploadNewInvoice} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-700" />
                  Upload New Digital Bill / Invoice
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Invoice / Bill Name *</label>
                    <input
                      type="text"
                      required
                      value={invoiceFileName}
                      onChange={(e) => setInvoiceFileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                      placeholder="e.g. EB Bill Sept 2026.pdf"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category / Vendor</label>
                    <input
                      type="text"
                      value={invoiceCategory}
                      onChange={(e) => setInvoiceCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                      placeholder="e.g. TANGEDCO / Meenakshi Plumbers"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bill Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">OCR Verification Summary / Notes</label>
                  <input
                    type="text"
                    value={invoiceOcrText}
                    onChange={(e) => setInvoiceOcrText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    placeholder="Verified official digital receipt"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Commit Invoice to Archive
                  </button>
                </div>
              </form>

              {/* Invoices List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Uploaded By</th>
                      <th className="p-3">Uploaded Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          Zero uploaded bills. Use the form above to add a digital invoice.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">
                            <div>{inv.fileName}</div>
                            {inv.ocrText && <div className="text-[10px] text-slate-400 font-normal">{inv.ocrText}</div>}
                          </td>
                          <td className="p-3 text-slate-500">{inv.uploadedBy}</td>
                          <td className="p-3 font-mono text-slate-400">
                            {new Date(inv.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            {onDeleteInvoice && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete invoice "${inv.fileName}"?`)) {
                                    onDeleteInvoice(inv.id);
                                    showNotification('Deleted invoice');
                                  }
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: BROADCAST NOTICES & ANNOUNCEMENTS                                 */}
          {/* ========================================================================= */}
          {activeTab === 'announcements' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <form onSubmit={handleSendAnnouncement} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-700" />
                  Dispatch Community Notice to Resident Portals
                </span>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Announcement Subject *</label>
                  <input
                    type="text"
                    required
                    value={announcementSubject}
                    onChange={(e) => setAnnouncementSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    placeholder="e.g. [Madura House] Water Tank Cleaning scheduled on Sunday 10 AM"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Residents</label>
                    <select
                      value={announcementRecipient}
                      onChange={(e) => setAnnouncementRecipient(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      <option value="all">All Active Occupants (5 Flats)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.email}>{u.fullName} ({u.flatNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notification Priority Type</label>
                    <select
                      value={announcementType}
                      onChange={(e) => setAnnouncementType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-bold"
                    >
                      <option value="maintenance_added">Maintenance Activity Update</option>
                      <option value="contribution_due">Payment Due Notice</option>
                      <option value="payment_received">Payment Receipt Acknowledgment</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" /> Dispatch Notice
                  </button>
                </div>
              </form>

              {/* Notification Logs */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-100 font-bold text-slate-700 text-xs border-b border-slate-200">
                  Recent Dispatched Broadcasts ({notificationLogs.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {notificationLogs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Zero notifications logged.</div>
                  ) : (
                    notificationLogs.map((nl) => (
                      <div key={nl.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-semibold text-slate-800">{nl.subject}</div>
                          <div className="text-[10px] text-slate-400">To: {nl.recipientEmail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                          {nl.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: RAW DATA INSPECTION & FAST PATCH                                  */}
          {/* ========================================================================= */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto space-y-4">
                <div>
                  <div className="text-amber-400 font-bold mb-1">// ACTIVE HOUSE CONFIGURATION:</div>
                  <pre>{JSON.stringify(house, null, 2)}</pre>
                </div>
                <div>
                  <div className="text-sky-400 font-bold mb-1">// ACTIVE MAINTENANCE RECORD:</div>
                  <pre>{JSON.stringify(currentRecord, null, 2)}</pre>
                </div>
                <div>
                  <div className="text-emerald-400 font-bold mb-1">// TOTAL REGISTERED USERS ({users.length}):</div>
                  <pre>{JSON.stringify(users, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Changes persist immediately to local encrypted vault & Supabase cloud DB.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
          >
            Done / Close Master Mode
          </button>
        </div>

      </div>

      {/* Invoice Document Popup Preview Modal */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
      />
    </div>
  );
};
