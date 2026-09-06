import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Mail, 
  ShieldCheck, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  UserCheck, 
  Database, 
  Volume2, 
  VolumeX, 
  X,
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { User, MaintenanceRecord, Expense, UserRole } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentRecord: MaintenanceRecord;
  currentUserRole: UserRole;
  onNavigate: (tab: 'dashboard' | 'maintenance' | 'tenants' | 'analytics' | 'invoices' | 'notifications' | 'audit') => void;
  onOpenAddExpense: () => void;
  onOpenAddTenant: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportTenantExcel: () => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenSettings: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  users,
  currentRecord,
  currentUserRole,
  onNavigate,
  onOpenAddExpense,
  onOpenAddTenant,
  onExportExcel,
  onExportPDF,
  onExportTenantExcel,
  onSwitchRole,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  interface PaletteItem {
    id: string;
    category: 'Navigation' | 'Actions' | 'Tenants' | 'Expenses';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
  }

  const items: PaletteItem[] = [];

  // 1. Navigation items
  items.push(
    {
      id: 'nav-dash',
      category: 'Navigation',
      title: 'Dashboard Overview',
      subtitle: 'Summary metrics, occupancy & financial status',
      icon: <LayoutDashboard className="w-4 h-4 text-[#0ab39c]" />,
      action: () => { onNavigate('dashboard'); onClose(); },
    },
    {
      id: 'nav-maint',
      category: 'Navigation',
      title: 'Maintenance & Expenses',
      subtitle: 'Monthly expense line items & per-unit split calculation',
      icon: <Calendar className="w-4 h-4 text-[#299cdb]" />,
      action: () => { onNavigate('maintenance'); onClose(); },
    },
    {
      id: 'nav-tenants',
      category: 'Navigation',
      title: 'Tenant Directory & CRM',
      subtitle: 'Resident occupancy records, leases & rent/deposit ledger',
      icon: <Users className="w-4 h-4 text-[#f7b84b]" />,
      action: () => { onNavigate('tenants'); onClose(); },
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      title: 'Financial Analytics & Trends',
      subtitle: 'Charts, monthly cost trends & category breakdowns',
      icon: <BarChart3 className="w-4 h-4 text-[#f06548]" />,
      action: () => { onNavigate('analytics'); onClose(); },
    },
    {
      id: 'nav-invoices',
      category: 'Navigation',
      title: 'Digital Invoices & Bills',
      subtitle: 'PDF bills, receipts & interactive document preview',
      icon: <FileText className="w-4 h-4 text-[#0ab39c]" />,
      action: () => { onNavigate('invoices'); onClose(); },
    },
    {
      id: 'nav-resend',
      category: 'Navigation',
      title: 'Resend Email Notifications',
      subtitle: 'Transactional maintenance dispatches & delivery logs',
      icon: <Mail className="w-4 h-4 text-[#299cdb]" />,
      action: () => { onNavigate('notifications'); onClose(); },
    },
    {
      id: 'nav-audit',
      category: 'Navigation',
      title: 'Security Audit Trail',
      subtitle: 'Immutable system telemetry & action logs',
      icon: <ShieldCheck className="w-4 h-4 text-[#878a99]" />,
      action: () => { onNavigate('audit'); onClose(); },
    }
  );

  // 2. Action items
  if (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') {
    items.push({
      id: 'act-add-exp',
      category: 'Actions',
      title: 'Add Maintenance Expense Item',
      subtitle: 'Record a new electricity, water, or repair expenditure',
      icon: <Plus className="w-4 h-4 text-[#0ab39c]" />,
      action: () => { onOpenAddExpense(); onClose(); },
    });
    items.push({
      id: 'act-add-tenant',
      category: 'Actions',
      title: 'Register New Tenant / Resident',
      subtitle: 'Add a new resident profile to Madura House directory',
      icon: <Users className="w-4 h-4 text-[#f7b84b]" />,
      action: () => { onOpenAddTenant(); onClose(); },
    });
  }

  items.push(
    {
      id: 'act-exp-pdf',
      category: 'Actions',
      title: 'Download Monthly Statement (PDF)',
      subtitle: 'Generate official audited maintenance statement PDF',
      icon: <FileText className="w-4 h-4 text-[#f06548]" />,
      action: () => { onExportPDF(); onClose(); },
    },
    {
      id: 'act-exp-excel',
      category: 'Actions',
      title: 'Download Monthly Statement (Excel)',
      subtitle: 'Export spreadsheet (.xlsx) with all expense line items',
      icon: <FileSpreadsheet className="w-4 h-4 text-[#0ab39c]" />,
      action: () => { onExportExcel(); onClose(); },
    },
    {
      id: 'act-exp-tenants',
      category: 'Actions',
      title: 'Export Tenant Directory (Excel)',
      subtitle: 'Download complete resident roster & rent/deposit ledger',
      icon: <Download className="w-4 h-4 text-[#299cdb]" />,
      action: () => { onExportTenantExcel(); onClose(); },
    },
    {
      id: 'act-settings',
      category: 'Actions',
      title: 'Open Platform Settings & Backup',
      subtitle: 'Download full JSON snapshot or test Cloud DB connectivity',
      icon: <Database className="w-4 h-4 text-[#405189]" />,
      action: () => { onOpenSettings(); onClose(); },
    }
  );

  // 3. Filtered Tenants
  if (query.trim()) {
    const q = query.toLowerCase();
    users.forEach((u) => {
      if (
        u.fullName.toLowerCase().includes(q) ||
        u.flatNumber.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      ) {
        items.push({
          id: `tenant-${u.id}`,
          category: 'Tenants',
          title: `${u.flatNumber}: ${u.fullName}`,
          subtitle: `${u.phone} • ${u.email} • Status: ${u.paymentStatus?.toUpperCase() || 'PAID'}`,
          icon: <Users className="w-4 h-4 text-[#405189]" />,
          action: () => { onNavigate('tenants'); onClose(); },
        });
      }
    });

    // 4. Filtered Expenses
    currentRecord.expenses.forEach((e) => {
      if (
        e.particular.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.amount.toString().includes(q)
      ) {
        items.push({
          id: `exp-${e.id}`,
          category: 'Expenses',
          title: `${e.particular} (₹${e.amount.toLocaleString('en-IN')})`,
          subtitle: `Category: ${e.category.toUpperCase()} • Added By: ${e.addedBy}`,
          icon: <Calendar className="w-4 h-4 text-[#0ab39c]" />,
          action: () => { onNavigate('maintenance'); onClose(); },
        });
      }
    });
  }

  // Filter based on query
  const filteredItems = items.filter((item) => {
    if (!query.trim()) return item.category === 'Navigation' || item.category === 'Actions';
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, flat number, resident, or expense..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/80 rounded border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">No matching commands or records found</p>
              <p className="text-[11px] mt-0.5">Try searching for a flat (e.g. "101"), an expense category, or "export".</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-[#405189]/10 text-[#405189]' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white shadow-xs' : 'bg-slate-100'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate flex items-center gap-2">
                        {item.title}
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-[#405189] translate-x-1' : 'text-slate-300 opacity-0'
                  }`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-slate-200 px-1 rounded text-[10px]">↑</kbd> <kbd className="font-mono bg-slate-200 px-1 rounded text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-slate-200 px-1 rounded text-[10px]">↵</kbd> to select</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <Command className="w-3 h-3" /> + K Omni-Search
          </div>
        </div>
      </div>
    </div>
  );
};
