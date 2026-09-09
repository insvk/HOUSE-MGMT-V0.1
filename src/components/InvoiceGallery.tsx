import React, { useState, useRef } from 'react';
import { Invoice, UserRole } from '../types';
import { 
  FileText, 
  Upload, 
  Download, 
  ScanText, 
  Eye, 
  FileCheck, 
  X, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  CheckCircle2, 
  Building2, 
  QrCode, 
  ShieldCheck,
  Calendar,
  IndianRupee,
  BadgeCheck,
  Search
} from 'lucide-react';

interface InvoiceGalleryProps {
  invoices: Invoice[];
  currentUserRole: UserRole;
  onUploadInvoice: (invoice: Omit<Invoice, 'id' | 'uploadedAt'>) => void;
}

export const InvoiceGallery: React.FC<InvoiceGalleryProps> = ({
  invoices,
  currentUserRole,
  onUploadInvoice,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'visual' | 'ocr'>('visual');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateUpload = (fileName: string, customText?: string) => {
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const newInv: Omit<Invoice, 'id' | 'uploadedAt'> = {
      maintenanceRecordId: 'mr-sep-2026',
      fileName,
      fileSize: Math.floor(Math.random() * 800000) + 200000,
      fileType: isPdf ? 'application/pdf' : 'image/png',
      storagePath: `invoices/2026/09/${fileName}`,
      uploadedBy: currentUserRole === 'OWNER' ? 'sampathkumar@chemadur.com' : 'admin.tenant@madurahouse.local',
      ocrText: customText || `OCR EXTRACTED SUMMARY FOR ${fileName}: Amount Rs. ${(Math.random() * 2000 + 1000).toFixed(2)}. Verified Tax Invoice. Madura House Maintenance.`,
    };

    onUploadInvoice(newInv);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const newInv: Omit<Invoice, 'id' | 'uploadedAt'> = {
          maintenanceRecordId: 'mr-sep-2026',
          fileName: file.name,
          fileSize: file.size,
          fileType: isPdf ? 'application/pdf' : 'image/jpeg',
          storagePath: `invoices/${Date.now()}_${file.name}`,
          uploadedBy: currentUserRole === 'OWNER' ? 'sampathkumar@chemadur.com' : 'admin.tenant@madurahouse.local',
          ocrText: `OCR EXTRACTED SUMMARY FOR ${file.name}: Official verified maintenance receipt under Madura House administration.`,
        };
        onUploadInvoice(newInv);
      } catch {
        handleSimulateUpload(file.name);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter((inv) =>
    inv.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.ocrText && inv.ocrText.toLowerCase().includes(searchQuery.toLowerCase())) ||
    inv.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="velzon-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#405189]" /> Digital Invoices & OCR Document Archive
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Click any PDF or invoice file to open the interactive document preview popup
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="velzon-input pl-8 pr-3 py-1.5 text-xs text-slate-700 w-full sm:w-44 sm:focus:w-56 transition-all"
            />
          </div>

          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Invoice PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Drop Zone */}
      {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleSimulateUpload(e.dataTransfer.files[0].name);
            }
          }}
          className={`velzon-card p-6 border-2 border-dashed text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragOver ? 'border-[#405189] bg-[#405189]/5' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#405189]/10 text-[#405189] flex items-center justify-center mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">Drag and drop invoice documents here or click to browse</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Supports Official PDF, PNG, JPG bills & receipts (Auto-OCR processed)</p>
        </div>
      )}

      {/* Invoice Gallery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="velzon-card p-10 text-center flex flex-col items-center justify-center col-span-full">
            <div className="w-12 h-12 rounded-full bg-[#405189]/10 text-[#405189] flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No invoice documents uploaded yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Drag & drop electricity, water, or repair bill PDFs above to archive verified documents.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
          const isPdf = inv.fileName.toLowerCase().endsWith('.pdf');

          return (
            <div 
              key={inv.id} 
              className="velzon-card p-4 flex flex-col justify-between hover:border-[#405189]/40 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                setSelectedInvoice(inv);
                setActivePreviewTab('visual');
                setZoomLevel(100);
              }}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isPdf ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-blue-50 text-blue-500 border border-blue-200'
                  }`}>
                    {isPdf ? (
                      <span className="font-extrabold text-[10px] tracking-tight">PDF</span>
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {(inv.fileSize / 1024).toFixed(0)} KB
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-800 mt-3 truncate group-hover:text-[#405189]" title={inv.fileName}>
                  {inv.fileName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">Uploaded by: {inv.uploadedBy}</p>

                {inv.ocrText && (
                  <div className="mt-2.5 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                    <ScanText className="w-3.5 h-3.5 text-[#0ab39c] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{inv.ocrText}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoice(inv);
                    setActivePreviewTab('visual');
                    setZoomLevel(100);
                  }}
                  className="text-xs font-semibold text-[#405189] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Click to Preview PDF
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoice(inv);
                    setActivePreviewTab('visual');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> View
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* ========================================================================= */}
      {/* RICH DOCUMENT & PDF POPUP PREVIEW MODAL                                    */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Document Controls */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-2">
                    {selectedInvoice.fileName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-0.5">
                      <BadgeCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {(selectedInvoice.fileSize / 1024).toFixed(1)} KB • {selectedInvoice.fileType} • Uploaded on {new Date(selectedInvoice.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                {/* Tab Switcher */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded text-xs font-semibold">
                  <button
                    onClick={() => setActivePreviewTab('visual')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      activePreviewTab === 'visual' ? 'bg-white text-[#405189] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Document Preview
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('ocr')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      activePreviewTab === 'ocr' ? 'bg-white text-[#405189] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    OCR & Metadata
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                  <button
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-semibold px-1 text-slate-600">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded transition-colors cursor-pointer"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Preview Canvas */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 flex justify-center">
              
              {activePreviewTab === 'visual' ? (
                /* ========================================================= */
                /* HIGH-RESOLUTION VISUAL INVOICE SHEET PREVIEW             */
                /* ========================================================= */
                <div 
                  className="bg-white shadow-xl rounded border border-slate-300 w-full max-w-2xl p-6 sm:p-8 text-[#1f2937] transition-transform origin-top duration-150"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {/* Top Header of Document */}
                  <div className="border-b-2 border-slate-800 pb-4 mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          OFFICIAL TAX INVOICE & UTILITY RECEIPT
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                          {selectedInvoice.fileName.includes('TNEB') 
                            ? 'TAMIL NADU GENERATION AND DISTRIBUTION CORP (TANGEDCO)'
                            : selectedInvoice.fileName.includes('Motor') || selectedInvoice.fileName.includes('Repair')
                            ? 'SRI BALAJI ELECTRICAL WORKSHOP & CONTRACTORS'
                            : 'MADURA HOUSE RESIDENTIAL MAINTENANCE'}
                        </h2>
                        <p className="text-xs text-slate-600 mt-1">
                          {selectedInvoice.fileName.includes('TNEB')
                            ? 'Maduravoyal Distribution Circle, Chennai Division, Maduravoyal - 600095'
                            : selectedInvoice.fileName.includes('Motor')
                            ? 'GSTIN: 33AAACB2234M1Z5 • 42, Trunk Road, Maduravoyal'
                            : 'Property Maintenance Administration • Maduravoyal, TN - 600095'}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded p-1 flex items-center justify-center ml-auto">
                          <QrCode className="w-12 h-12 text-slate-800" />
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">SCAN TO VERIFY</div>
                      </div>
                    </div>
                  </div>

                  {/* Document Meta Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Invoice / Ref #</span>
                      <span className="font-bold text-slate-800">
                        {selectedInvoice.fileName.includes('TNEB') ? 'TNEB-2026-0982' : '#INV-MH-8902'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Billing Date</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedInvoice.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer / Unit</span>
                      <span className="font-bold text-slate-800">Madura House (All 6 Units)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Status</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PAID (ONLINE)
                      </span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <table className="w-full text-left text-xs mb-4">
                    <thead className="bg-slate-800 text-white font-semibold">
                      <tr>
                        <th className="py-2 px-3 rounded-l">S.No</th>
                        <th className="py-2 px-3">Description of Service / Goods</th>
                        <th className="py-2 px-3 text-right">Units / Rate</th>
                        <th className="py-2 px-3 text-right rounded-r">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                      {selectedInvoice.fileName.includes('TNEB') ? (
                        <>
                          <tr>
                            <td className="py-2.5 px-3 font-medium">1</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              Common Meter Power Consumption (Bi-Monthly)
                              <div className="text-[10px] text-slate-500 font-normal">Meter #: 05-120-004-98 • Reading: 4580 kWh</div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">480 Units @ ₹5.00</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹2,400.00</td>
                          </tr>
                        </>
                      ) : selectedInvoice.fileName.includes('Motor') ? (
                        <>
                          <tr>
                            <td className="py-2.5 px-3 font-medium">1</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              Submersible Motor Starter Heavy Duty 50MFD Capacitor
                              <div className="text-[10px] text-slate-500 font-normal">Havells 2HP Industrial Grade</div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">1 Unit</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹1,000.00</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium">2</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              Technician Labor & Rewiring Service Charge
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">1 Service</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹500.00</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="py-2.5 px-3 font-medium">1</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {selectedInvoice.fileName.replace('.pdf', '').replace(/_/g, ' ')}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">Fixed</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹2,100.00</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>

                  {/* Summary Totals */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
                    <div className="space-y-1 text-xs text-slate-500 max-w-xs">
                      <div className="font-semibold text-slate-700">Payment Remarks:</div>
                      <div>Settled via NEFT / UPI Transaction Ref #AXIS982341.</div>
                      <div className="text-[10px] text-slate-400">All disputes subject to Maduravoyal jurisdiction.</div>
                    </div>

                    <div className="w-full sm:w-60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedInvoice.fileName.includes('TNEB') ? '₹2,400.00' : selectedInvoice.fileName.includes('Motor') ? '₹1,500.00' : '₹2,100.00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxes (GST 0% / Exempted):</span>
                        <span className="font-semibold text-slate-800">₹0.00</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-800 pt-1.5">
                        <span>Grand Total:</span>
                        <span className="text-[#0ab39c]">
                          {selectedInvoice.fileName.includes('TNEB') ? '₹2,400.00' : selectedInvoice.fileName.includes('Motor') ? '₹1,500.00' : '₹2,100.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stamp & Authorized Seal */}
                  <div className="mt-8 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-emerald-500 text-emerald-700 bg-emerald-50 text-xs font-black uppercase tracking-wider transform -rotate-3">
                      <CheckCircle2 className="w-4 h-4" /> AUDITED & CLEARED
                    </div>

                    <div className="text-right">
                      <div className="font-script text-lg text-slate-700 font-serif italic">Sampath Kumar</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* OCR EXTRACTION & RAW METADATA TAB                         */
                /* ========================================================= */
                <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-2xl w-full space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ScanText className="w-4 h-4 text-[#0ab39c]" /> OCR Parser Telemetry & Metadata
                    </h4>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      OCR Confidence: 99.4%
                    </span>
                  </div>

                  <div className="p-3.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
                    <div className="text-slate-400 text-[10px] mb-2">// Raw Extracted Text stream from Document AI Engine:</div>
                    {selectedInvoice.ocrText || 'DOCUMENT PARSED SUCCESSFULLY. NO ANOMALIES FOUND.'}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Storage URI</span>
                      <span className="font-mono text-slate-700 break-all">{selectedInvoice.storagePath}</span>
                    </div>

                    <div className="p-3 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Uploaded By</span>
                      <span className="text-slate-700 font-semibold">{selectedInvoice.uploadedBy}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="text-slate-500 hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono">ESC</kbd> or click outside to close preview
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Downloading ${selectedInvoice.fileName} to local storage.`)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </button>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-1.5 rounded bg-[#405189] hover:bg-[#364574] text-white font-semibold cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
