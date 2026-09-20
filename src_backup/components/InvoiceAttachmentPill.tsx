import React from 'react';
import { FileText, Image as ImageIcon, Eye, Download, Paperclip, Plus } from 'lucide-react';
import { Expense } from '../types';
import { InvoicePreviewData } from './InvoicePreviewModal';

interface InvoiceAttachmentPillProps {
  expense: Expense;
  onOpenPreview: (invoice: InvoicePreviewData) => void;
  onQuickAttach?: (expense: Expense) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const InvoiceAttachmentPill: React.FC<InvoiceAttachmentPillProps> = ({
  expense,
  onOpenPreview,
  onQuickAttach,
  className = '',
  size = 'md',
}) => {
  const hasAttachment = Boolean(expense.invoiceFileName || expense.invoiceUrl);

  const isPdf = Boolean(
    expense.invoiceFileType === 'application/pdf' || 
    (expense.invoiceFileName && expense.invoiceFileName.toLowerCase().endsWith('.pdf')) ||
    (expense.invoiceUrl && expense.invoiceUrl.toLowerCase().endsWith('.pdf'))
  );

  const formattedSize = expense.invoiceFileSize
    ? expense.invoiceFileSize > 1024 * 1024
      ? `${(expense.invoiceFileSize / (1024 * 1024)).toFixed(1)}MB`
      : `${Math.round(expense.invoiceFileSize / 1024)}KB`
    : isPdf ? '280KB' : '190KB';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenPreview({
      fileName: expense.invoiceFileName || `${expense.particular.replace(/[^a-zA-Z0-9]/g, '_')}_Invoice.${isPdf ? 'pdf' : 'jpg'}`,
      fileUrl: expense.invoiceUrl,
      fileType: expense.invoiceFileType || (isPdf ? 'application/pdf' : 'image/jpeg'),
      fileSize: expense.invoiceFileSize || (isPdf ? 284500 : 198000),
      particular: expense.particular,
      amount: expense.amount,
      category: expense.category,
      date: expense.createdAt,
      notes: expense.notes,
      ocrText: expense.ocrText,
      addedBy: expense.addedBy,
    });
  };

  if (!hasAttachment) {
    if (onQuickAttach) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAttach(expense);
          }}
          className={`inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/60 border border-dashed border-slate-300 hover:border-indigo-400 px-2 py-0.5 rounded-md transition-all cursor-pointer mt-1 ${className}`}
          title="Click to attach an invoice PDF or JPG to this expense"
        >
          <Plus className="w-2.5 h-2.5 text-indigo-500" />
          <span>Attach Invoice PDF / JPG</span>
        </button>
      );
    }
    return null;
  }

  const fileName = expense.invoiceFileName || 'Invoice_Document.pdf';

  return (
    <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group inline-flex items-center gap-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs select-none ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
        } ${
          isPdf 
            ? 'bg-rose-50/80 hover:bg-rose-100/90 text-rose-800 border-rose-200 hover:border-rose-300 hover:shadow-xs' 
            : 'bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-800 border-indigo-200 hover:border-indigo-300 hover:shadow-xs'
        }`}
        title={`Click to preview and download ${fileName}`}
      >
        <span className={`p-0.5 rounded ${isPdf ? 'bg-rose-200/70 text-rose-700' : 'bg-indigo-200/70 text-indigo-700'}`}>
          {isPdf ? <FileText className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
        </span>

        <span className="font-semibold truncate max-w-[150px] sm:max-w-[220px]">
          {fileName}
        </span>

        <span className={`text-[9px] font-mono px-1 rounded font-bold ${
          isPdf ? 'bg-rose-200/50 text-rose-700' : 'bg-indigo-200/50 text-indigo-700'
        }`}>
          {isPdf ? 'PDF' : 'JPG'} • {formattedSize}
        </span>

        <span className="opacity-70 group-hover:opacity-100 flex items-center gap-0.5 text-[10px] font-bold underline decoration-dotted ml-0.5">
          <Eye className="w-3 h-3 inline" />
          <span>View</span>
        </span>
      </button>
    </div>
  );
};
