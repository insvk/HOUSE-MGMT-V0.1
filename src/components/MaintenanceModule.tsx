import React, { useState } from 'react';
import { MaintenanceRecord, Expense, ExpenseCategory, UserRole } from '../types';
import { 
  Plus, 
  Trash2, 
  IndianRupee, 
  Calculator, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle,
  Tag,
  Edit3,
  CheckCircle2,
  Filter,
  Download
} from 'lucide-react';

interface MaintenanceModuleProps {
  records: MaintenanceRecord[];
  activeRecord: MaintenanceRecord;
  currentUserRole: UserRole;
  onSelectRecord: (recordId: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onOpenEditExpense?: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const MaintenanceModule: React.FC<MaintenanceModuleProps> = ({
  records,
  activeRecord,
  currentUserRole,
  onSelectRecord,
  onAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onExportExcel,
  onExportPDF,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [particular, setParticular] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('maintenance');
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstAmount, setGstAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!particular || !amount) return;

    const newExpense: Omit<Expense, 'id' | 'createdAt'> = {
      maintenanceRecordId: activeRecord.id,
      slNo: activeRecord.expenses.length + 1,
      particular,
      amount: parseFloat(amount),
      category,
      gstApplicable,
      gstAmount: gstApplicable && gstAmount ? parseFloat(gstAmount) : 0,
      notes,
      addedBy: currentUserRole === 'OWNER' ? 'Sampath Kumar' : 'Rajesh Kumar',
    };

    onAddExpense(newExpense);
    setShowAddModal(false);
    setParticular('');
    setAmount('');
    setNotes('');
    setGstApplicable(false);
    setGstAmount('');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="velzon-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#405189]" /> Monthly Maintenance & Expense Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Itemized line expenses with automatic individual contribution split
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Record Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
            <span className="text-xs text-slate-500 font-semibold">Period:</span>
            <select
              value={activeRecord.id}
              onChange={(e) => onSelectRecord(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
            >
              {records.map((r) => (
                <option key={r.id} value={r.id}>
                  {monthNames[r.month - 1]} {r.year} (₹{r.grandTotal.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-[#0ab39c] hover:bg-[#089380] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line Item
            </button>
          )}

          <button
            onClick={onExportExcel}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0ab39c]" /> Excel
          </button>

          <button
            onClick={onExportPDF}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-[#f06548]" /> PDF
          </button>
        </div>
      </div>

      {/* 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="velzon-card p-4 border-l-4 border-l-[#405189]">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Month Expense</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">₹{activeRecord.grandTotal.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-500 mt-1">{activeRecord.expenses.length} Itemized Line Entries</div>
        </div>

        <div className="velzon-card p-4 border-l-4 border-l-[#0ab39c]">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Active Tenant Units</div>
          <div className="text-2xl font-bold text-[#0ab39c] mt-1">{activeRecord.activeTenantsCount} Flats</div>
          <div className="text-xs text-slate-500 mt-1">Occupancy rate: 100% (6/6 Flats)</div>
        </div>

        <div className="velzon-card p-4 border-l-4 border-l-[#299cdb]">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Individual Tenant Share</div>
          <div className="text-2xl font-bold text-[#405189] mt-1">₹{activeRecord.individualContribution.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-[#299cdb]" /> Split equally across active flats
          </div>
        </div>
      </div>

      {/* Main Expense Table Card */}
      <div className="velzon-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Expenses Breakdown for {monthNames[activeRecord.month - 1]} {activeRecord.year}
          </h2>
          <span className="text-xs text-slate-400 font-mono">Record: {activeRecord.id}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Particulars / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">GST Detail</th>
                <th className="py-3 px-4">Added By</th>
                {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                  <th className="py-3 px-4 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeRecord.expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No expense line items recorded for this month yet.
                  </td>
                </tr>
              ) : (
                activeRecord.expenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{exp.particular}</div>
                      {exp.notes && <div className="text-[11px] text-slate-500 mt-0.5">{exp.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        exp.category === 'utilities' ? 'bg-[#299cdb]/10 text-[#299cdb]' :
                        exp.category === 'repairs' ? 'bg-[#f7b84b]/10 text-[#f7b84b]' :
                        exp.category === 'cleaning' ? 'bg-[#0ab39c]/10 text-[#0ab39c]' :
                        'bg-[#405189]/10 text-[#405189]'
                      }`}>
                        <Tag className="w-3 h-3" /> {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {exp.gstApplicable ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#0ab39c]/10 text-[#0ab39c] font-bold">
                          GST +₹{exp.gstAmount}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.addedBy}</td>
                    {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenEditExpense && (
                            <button
                              onClick={() => onOpenEditExpense(exp)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#405189]"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 text-slate-700">Grand Total Monthly Maintenance</td>
                <td className="py-3.5 px-4 text-right text-slate-900 text-sm">
                  ₹{activeRecord.grandTotal.toLocaleString('en-IN')}
                </td>
                <td colSpan={currentUserRole === 'TENANT' ? 2 : 3} className="py-3.5 px-4 text-right text-xs text-slate-500 font-normal">
                  Individual Tenant Share: <strong className="text-[#405189] font-mono text-sm">₹{activeRecord.individualContribution.toFixed(2)}</strong> / unit
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Line Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0ab39c]" /> Add Maintenance Line Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Particulars / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tank cleaning / Motor switch repair"
                  value={particular}
                  onChange={(e) => setParticular(e.target.value)}
                  className="w-full velzon-input px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full velzon-input px-3 py-2 text-xs"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="utilities">Utilities (EB/Water)</option>
                    <option value="repairs">Repairs</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="gstToggleAdd"
                  checked={gstApplicable}
                  onChange={(e) => setGstApplicable(e.target.checked)}
                  className="rounded accent-[#405189] w-4 h-4"
                />
                <label htmlFor="gstToggleAdd" className="text-xs text-slate-700 font-medium">GST Applicable?</label>
              </div>

              {gstApplicable && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GST Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="270"
                    value={gstAmount}
                    onChange={(e) => setGstAmount(e.target.value)}
                    className="w-full velzon-input px-3 py-2 text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Bill Reference</label>
                <textarea
                  rows={2}
                  placeholder="Optional details or invoice number"
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
                  className="px-4 py-1.5 rounded bg-[#0ab39c] hover:bg-[#089380] text-white text-xs font-semibold shadow-sm"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
