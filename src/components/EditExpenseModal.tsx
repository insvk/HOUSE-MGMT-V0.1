import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { Edit3, Save, X, IndianRupee, Tag } from 'lucide-react';

interface EditExpenseModalProps {
  expense: Expense;
  onSave: (updatedExpense: Expense) => void;
  onClose: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, onSave, onClose }) => {
  const [particular, setParticular] = useState(expense.particular);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [gstApplicable, setGstApplicable] = useState(expense.gstApplicable);
  const [gstAmount, setGstAmount] = useState(expense.gstAmount ? expense.gstAmount.toString() : '0');
  const [notes, setNotes] = useState(expense.notes || '');

  useEffect(() => {
    setParticular(expense.particular);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setGstApplicable(expense.gstApplicable);
    setGstAmount(expense.gstAmount ? expense.gstAmount.toString() : '0');
    setNotes(expense.notes || '');
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!particular || !amount) return;

    onSave({
      ...expense,
      particular,
      amount: parseFloat(amount),
      category,
      gstApplicable,
      gstAmount: gstApplicable && gstAmount ? parseFloat(gstAmount) : 0,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#405189]/10 text-[#405189] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Edit Maintenance Expense</h3>
              <p className="text-[11px] text-slate-500">ID: {expense.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Particulars / Item Description *</label>
            <input
              type="text"
              required
              value={particular}
              onChange={(e) => setParticular(e.target.value)}
              className="w-full velzon-input px-3 py-2 text-xs"
              placeholder="e.g. Common Area Electricity Bill"
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
              id="gstEditToggle"
              checked={gstApplicable}
              onChange={(e) => setGstApplicable(e.target.checked)}
              className="rounded accent-[#405189] w-4 h-4"
            />
            <label htmlFor="gstEditToggle" className="text-xs text-slate-700 font-medium">GST Applicable?</label>
          </div>

          {gstApplicable && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GST Amount (₹)</label>
              <input
                type="number"
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full velzon-input px-3 py-2 text-xs"
              placeholder="Vendor name or bill serial number"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
