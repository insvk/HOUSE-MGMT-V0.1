import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MaintenanceRecord, House, Expense, User, AuditLog } from '../types';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Legitimate Excel (.xlsx) Export using SheetJS
 */
export const exportMaintenanceToExcel = (record: MaintenanceRecord, house?: House) => {
  const monthName = monthNames[record.month - 1] || `Month-${record.month}`;
  const fileName = `MaduraHouse_Maintenance_${monthName}_${record.year}.xlsx`;

  // 1. Build Header Section
  const worksheetData: (string | number)[][] = [
    ['MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM'],
    [`OFFICIAL MONTHLY MAINTENANCE STATEMENT - ${monthName.toUpperCase()} ${record.year}`],
    [`Property Address: ${house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, ${house?.city || 'Madurai'} - ${house?.postalCode || '625001'}`],
    [`Statement Reference ID: ${record.id.toUpperCase()}`],
    [], // Blank line
    // Table Header
    ['S.No', 'Particulars / Description', 'Category', 'Base Amount (INR)', 'GST Applicable', 'GST Amount (INR)', 'Total Amount (INR)', 'Added By', 'Date Recorded']
  ];

  // 2. Line Items
  if (record.expenses.length === 0) {
    worksheetData.push(['-', 'No maintenance expenses recorded for this billing cycle', '-', 0, 'No', 0, 0, '-', '-']);
  } else {
    record.expenses.forEach((exp: Expense, index: number) => {
      worksheetData.push([
        index + 1,
        exp.particular,
        exp.category.toUpperCase(),
        exp.amount,
        exp.gstApplicable ? 'Yes' : 'No',
        exp.gstAmount || 0,
        exp.amount + (exp.gstAmount || 0),
        exp.addedBy,
        new Date(exp.createdAt).toLocaleDateString('en-IN')
      ]);
    });
  }

  // 3. Totals & Financial Summary
  worksheetData.push([]);
  worksheetData.push(['', 'GRAND TOTAL EXPENDITURE', '', '', '', '', record.grandTotal, '', '']);
  worksheetData.push(['', 'TOTAL ACTIVE FLATS / UNITS', '', '', '', '', record.activeTenantsCount || 5, '', '']);
  worksheetData.push(['', 'EQUAL PER-FLAT SHARE DUE', '', '', '', '', Number(record.individualContribution.toFixed(2)), '', '']);
  worksheetData.push([]);
  worksheetData.push(['Notes / Remarks:', record.notes || 'Official audited maintenance record for Madura House.']);
  worksheetData.push(['Generated On:', new Date().toLocaleString('en-IN')]);
  worksheetData.push(['Status:', 'Audited & Verified - Official Copy']);

  // 4. Create Workbook & Sheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Column Widths
  worksheet['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 45 }, // Particulars
    { wch: 16 }, // Category
    { wch: 18 }, // Base Amount
    { wch: 15 }, // GST
    { wch: 16 }, // GST Amount
    { wch: 18 }, // Total Amount
    { wch: 20 }, // Added By
    { wch: 16 }, // Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${record.year}`);

  // Write and trigger download
  XLSX.writeFile(workbook, fileName);
};

/**
 * Legitimate PDF (.pdf) Export using jsPDF & autoTable
 */
export const exportMaintenanceToPDF = (record: MaintenanceRecord, house?: House) => {
  const monthName = monthNames[record.month - 1] || `Month-${record.month}`;
  const fileName = `MaduraHouse_Maintenance_${monthName}_${record.year}.pdf`;

  // Create A4 Portrait document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Decorative Brand Bar
  doc.setFillColor(33, 37, 41); // #212529 Dark Navy
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(10, 179, 156); // #0ab39c Teal Accent Stripe
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Top Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Official Monthly Maintenance Statement & Tenant Share Distribution', 14, 18);

  // 2. Property & Statement Meta Box
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Billing Cycle: ${monthName.toUpperCase()} ${record.year}`, 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Property: ${house?.name || 'Madura House'}, ${house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, ${house?.city || 'Madurai'} - ${house?.postalCode || '625001'}`, 14, 40);
  doc.text(`Statement Ref: #${record.id.toUpperCase()}  •  Audited By: Property Administration  •  Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 45);

  // 3. Three Metric Highlight Cards
  const cardY = 50;
  const cardWidth = 56;
  const cardHeight = 20;

  // Card 1: Total Cost
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL EXPENDITURE', 18, cardY + 6);
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rs. ${record.grandTotal.toLocaleString('en-IN')}`, 18, cardY + 14);

  // Card 2: Units
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + cardWidth + 5, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ACTIVE OCCUPANCY', 14 + cardWidth + 9, cardY + 6);
  doc.setFontSize(12);
  doc.setTextColor(10, 179, 156);
  doc.text(`${record.activeTenantsCount || 5} Residential Flats`, 14 + cardWidth + 9, cardY + 14);

  // Card 3: Per-Tenant Contribution Due
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(14 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(13, 148, 136);
  doc.text('PER-FLAT DUE SHARE', 14 + (cardWidth + 5) * 2 + 4, cardY + 6);
  doc.setFontSize(12);
  doc.setTextColor(15, 118, 110);
  doc.text(`Rs. ${record.individualContribution.toFixed(2)}`, 14 + (cardWidth + 5) * 2 + 4, cardY + 14);

  // 4. Line Items Table using autoTable
  const tableData = record.expenses.length === 0
    ? [['-', 'No expenses recorded for this billing cycle yet', '-', '0.00', '0.00', '0.00', '-']]
    : record.expenses.map((exp: Expense, idx: number) => [
        (idx + 1).toString(),
        exp.particular,
        exp.category.toUpperCase(),
        `Rs. ${exp.amount.toLocaleString('en-IN')}`,
        exp.gstApplicable ? `Rs. ${exp.gstAmount || 0}` : 'Exempt',
        `Rs. ${(exp.amount + (exp.gstAmount || 0)).toLocaleString('en-IN')}`,
        exp.addedBy
      ]);

  autoTable(doc, {
    startY: 76,
    head: [['#', 'Particulars / Description', 'Category', 'Base Amount', 'GST', 'Total Cost', 'Authorized By']],
    body: tableData,
    foot: [[
      '',
      'Grand Total Monthly Maintenance',
      '',
      '',
      '',
      `Rs. ${record.grandTotal.toLocaleString('en-IN')}`,
      ''
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: [64, 81, 137], // #405189 Velzon Navy
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 24 },
    },
  });

  // 5. Verification & Official Stamp Section at bottom
  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Split Summary Box
  const summaryBoxY = Math.min(finalY + 8, 230);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Instructions & Notes:', 18, summaryBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('• Monthly maintenance share must be remitted by the 10th of the current month.', 18, summaryBoxY + 11);
  doc.text('• Payment modes: Direct Bank Transfer (NEFT/IMPS) or UPI to Property Management Account.', 18, summaryBoxY + 15);
  doc.text(`• Individual tenant share amount: Rs. ${record.individualContribution.toFixed(2)} due per flat.`, 18, summaryBoxY + 19);
  doc.text('• For billing queries, contact Property Administration at sampathkumar@chemadur.com.', 18, summaryBoxY + 23);

  // Official Signature Block
  const sigY = summaryBoxY + 36;
  if (sigY < 275) {
    // Official Stamp
    doc.setDrawColor(16, 185, 129); // Emerald
    doc.setLineWidth(0.8);
    doc.roundedRect(14, sigY, 52, 14, 1.5, 1.5, 'D');
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AUDITED & CLEARED', 18, sigY + 6);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Madura House Property Mgmt', 18, sigY + 10);

    // Signatory
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Sampath Kumar', pageWidth - 55, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Property Owner & Administrator', pageWidth - 55, sigY + 10);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Madura House Maintenance Management Platform V0.1', 14, 288);
  doc.text('Page 1 of 1', pageWidth - 25, 288);

  // Download PDF directly
  doc.save(fileName);
};

/**
 * Legitimate Tenant Roster Excel (.xlsx) Export
 */
export const exportTenantsToExcel = (users: User[], house?: House) => {
  const fileName = `MaduraHouse_Tenants_Directory_${new Date().toISOString().split('T')[0]}.xlsx`;

  const worksheetData: (string | number)[][] = [
    ['MADURA HOUSE RESIDENTIAL DIRECTORY & LEASE LEDGER'],
    [`Property Address: ${house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, ${house?.city || 'Madurai'} - ${house?.postalCode || '625001'}`],
    [`Generated On: ${new Date().toLocaleString('en-IN')}`],
    [],
    ['S.No', 'Flat / Unit', 'Resident Name', 'Phone', 'Email', 'Role Privilege', 'Occupancy Status', 'Payment Status', 'Monthly Rent (INR)', 'Security Deposit (INR)', 'Move-In Date', 'Emergency Contact']
  ];

  users.forEach((user, idx) => {
    worksheetData.push([
      idx + 1,
      user.flatNumber,
      user.fullName,
      user.phone,
      user.email,
      user.role,
      user.occupancyStatus.toUpperCase(),
      (user.paymentStatus || 'paid').toUpperCase(),
      user.rentAmount || 0,
      user.depositAmount || 0,
      user.moveInDate || '-',
      user.emergencyContact || '-'
    ]);
  });

  worksheetData.push([]);
  const totalRent = users.reduce((acc, u) => acc + (u.rentAmount || 0), 0);
  const totalDeposit = users.reduce((acc, u) => acc + (u.depositAmount || 0), 0);
  worksheetData.push(['', 'TOTAL ACTIVE UNITS', users.length, '', '', '', '', 'PORTFOLIO TOTALS:', totalRent, totalDeposit, '', '']);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 14 }, // Flat
    { wch: 25 }, // Name
    { wch: 18 }, // Phone
    { wch: 30 }, // Email
    { wch: 16 }, // Role
    { wch: 16 }, // Status
    { wch: 16 }, // Payment
    { wch: 18 }, // Rent
    { wch: 20 }, // Deposit
    { wch: 16 }, // Move In
    { wch: 18 }, // Emergency
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenant Directory');
  XLSX.writeFile(workbook, fileName);
};

/**
 * Legitimate Tenant Directory PDF (.pdf) Export
 */
export const exportTenantsToPDF = (users: User[], house?: House) => {
  const fileName = `MaduraHouse_Tenants_Directory_${new Date().toISOString().split('T')[0]}.pdf`;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(33, 37, 41);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFillColor(10, 179, 156);
  doc.rect(0, 20, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('MADURA HOUSE - RESIDENTIAL OCCUPANCY & LEASE DIRECTORY', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Official Register • Address: ${house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, ${house?.city || 'Madurai'} • Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 17);

  const tableData = users.map((u, idx) => [
    (idx + 1).toString(),
    u.flatNumber,
    u.fullName,
    u.phone,
    u.email,
    u.role,
    u.occupancyStatus.toUpperCase(),
    (u.paymentStatus || 'paid').toUpperCase(),
    `Rs. ${(u.rentAmount || 0).toLocaleString('en-IN')}`,
    `Rs. ${(u.depositAmount || 0).toLocaleString('en-IN')}`,
    u.emergencyContact || '-'
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['#', 'Flat', 'Resident Name', 'Phone', 'Email', 'Role', 'Status', 'Payment', 'Rent (mo)', 'Deposit', 'Emergency']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [64, 81, 137],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 26 },
      4: { cellWidth: 42 },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 24, halign: 'right' },
      10: { cellWidth: 26 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Certified Confidential Property Record • Madura House Management Platform V0.1', 14, Math.min(finalY + 12, 195));

  doc.save(fileName);
};

/**
 * Compliance Audit Log Export to CSV (.csv)
 */
export const exportAuditLogsToCSV = (logs: AuditLog[]) => {
  const fileName = `MaduraHouse_Security_Audit_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = ['Log ID', 'User Email', 'Action Performed', 'Resource Type', 'Resource ID', 'Client IP', 'Timestamp'];
  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.userEmail}"`,
    `"${l.action}"`,
    `"${l.resourceType}"`,
    `"${l.resourceId || '-'}"`,
    `"${l.ipAddress}"`,
    `"${new Date(l.timestamp).toISOString()}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

