// Executive PDF & Excel Export Engines for CHE-MADURA HS-1 MGMT V0.1
// Ported from React exportUtils.ts with dynamic property resolving, styled tables, signatures, and formulas.

(function() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const defaultHouse = {
        name: 'CHE-MADURA HS-1 MGMT',
        address: '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal',
        city: 'Chennai',
        postalCode: '600095',
        totalUnits: 5,
        settings: {
            currency: 'INR',
            upiId: '',
            upiName: 'Sampath Kumar'
        }
    };

    function getActiveHouse(providedHouse) {
        let active = {};
        if (providedHouse && (providedHouse.name || providedHouse.address)) {
            active = providedHouse;
        } else {
            try {
                const saved = localStorage.getItem('madura_house_property_v1');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed === 'object') active = parsed;
                }
            } catch (e) {}
        }
        return {
            ...defaultHouse,
            ...active,
            settings: {
                ...defaultHouse.settings,
                ...(active.settings || {})
            }
        };
    }

    function formatHouseAddress(house) {
        const parts = [];
        const addr = (house.address || '').trim();
        const city = (house.city || '').trim();
        const postal = (house.postalCode || '').trim();

        if (addr) parts.push(addr);
        if (city && !addr.toLowerCase().includes(city.toLowerCase())) {
            parts.push(city);
        }
        let result = parts.join(', ');
        if (postal && !result.includes(postal)) {
            result = result ? `${result} - ${postal}` : postal;
        }
        return result || 'Address Not Configured';
    }

    function sanitizeFileName(name) {
        return (name || 'Property').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function generateDiplomaticRef(record, house) {
        const year = record.year || new Date().getFullYear();
        const month = String(record.month || (new Date().getMonth() + 1)).padStart(2, '0');
        const prefix = sanitizeFileName(house?.name || 'PROPERTY').substring(0, 10).toUpperCase();
        let suffix = '001';
        if (record.id && record.id !== 'OFFICIAL') {
            suffix = record.id.split('-')[0].toUpperCase().substring(0, 6);
        }
        return `${prefix}/${year}/${month}/STMT-${suffix}`;
    }

    // 1. Export Maintenance to Excel (.xlsx)
    function exportMaintenanceToExcel(records, house) {
        const recordList = Array.isArray(records) ? records : [records];
        if (recordList.length === 0) {
            alert('No maintenance records available to export.');
            return;
        }
        const record = recordList[0];
        const activeHouse = getActiveHouse(house);
        const propName = activeHouse.name || 'CHE-MADURA HS-1 MGMT';
        const propAddress = formatHouseAddress(activeHouse);
        const currency = activeHouse.settings?.currency || 'INR';
        const monthName = monthNames[(record.month || 9) - 1] || `Month-${record.month}`;
        const propertySlug = sanitizeFileName(propName);
        const fileName = `${propertySlug}_Maintenance_${monthName}_${record.year || 2026}.xlsx`;

        const expenses = record.expenses || [];
        const grandTotal = record.grand_total != null ? parseFloat(record.grand_total) : (record.grandTotal != null ? parseFloat(record.grandTotal) : expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0));
        const activeTenants = 5;
        const individualContribution = (grandTotal / 5);

        const worksheetData = [
            [`${propName.toUpperCase()} MAINTENANCE MANAGEMENT PLATFORM`],
            [`OFFICIAL MONTHLY MAINTENANCE STATEMENT - ${monthName.toUpperCase()} ${record.year || 2026}`],
            [`Property Address: ${propAddress}`],
            [`Statement Reference ID: ${generateDiplomaticRef(record, activeHouse)}`],
            [],
            ['S.No', 'Particulars / Description', 'Category', 'Attached Invoice / Voucher', `Base Amount (${currency})`, 'GST Applicable', `GST Amount (${currency})`, `Total Amount (${currency})`, 'Added By', 'Date Recorded']
        ];

        if (expenses.length === 0) {
            worksheetData.push(['-', 'No maintenance expenses recorded for this billing cycle', '-', '-', 0, 'No', 0, 0, '-', '-']);
        } else {
            expenses.forEach((exp, index) => {
                const amount = parseFloat(exp.amount || 0);
                const gst = exp.gst_amount != null ? parseFloat(exp.gst_amount) : (exp.gstAmount != null ? parseFloat(exp.gstAmount) : 0);
                worksheetData.push([
                    index + 1,
                    exp.particular || 'Maintenance Line Item',
                    (exp.category || 'maintenance').toUpperCase(),
                    exp.invoice_file_name || exp.invoiceFileName || 'Pending Upload',
                    amount,
                    (exp.gst_applicable || exp.gstApplicable) ? 'Yes' : 'No',
                    gst,
                    amount + gst,
                    exp.added_by || exp.addedBy || 'Property Administrator',
                    new Date(exp.created_at || exp.createdAt || Date.now()).toLocaleDateString('en-IN')
                ]);
            });
        }

        worksheetData.push([]);
        worksheetData.push(['', 'GRAND TOTAL EXPENDITURE', '', '', '', '', '', grandTotal, '', '']);
        worksheetData.push(['', 'TOTAL ACTIVE FLATS / UNITS', '', '', '', '', '', activeTenants, '', '']);
        worksheetData.push(['', 'EQUAL PER-FLAT SHARE DUE', '', '', '', '', '', Number(individualContribution.toFixed(2)), '', '']);
        worksheetData.push([]);
        worksheetData.push(['Notes / Remarks:', record.notes || `Official audited maintenance record for ${propName}.`]);
        worksheetData.push(['Generated On:', new Date().toLocaleString('en-IN')]);
        worksheetData.push(['Status:', 'Audited & Verified - Official Copy']);

        const worksheet = window.XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 8 }, { wch: 45 }, { wch: 16 }, { wch: 25 }, { wch: 16 },
            { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 16 }
        ];

        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${record.year || 2026}`);
        window.XLSX.writeFile(workbook, fileName);
        if (window.audioUtils) window.audioUtils.playSuccessChime();
    }

    // 2. Export Maintenance to PDF (.pdf)
    function exportMaintenanceToPDF(records, house) {
        const recordList = Array.isArray(records) ? records : [records];
        if (recordList.length === 0) {
            alert('No maintenance records available to export.');
            return;
        }
        const record = recordList[0];
        const activeHouse = getActiveHouse(house);
        const propName = activeHouse.name || 'CHE-MADURA HS-1 MGMT';
        const propAddress = formatHouseAddress(activeHouse);
        const currency = activeHouse.settings?.currency || 'INR';
        const pdfCurrency = currency === '₹' || currency === '?' ? 'Rs.' : currency;
        const monthName = monthNames[(record.month || 9) - 1] || `Month-${record.month}`;
        const propertySlug = sanitizeFileName(propName);
        const fileName = `${propertySlug}_Maintenance_${monthName}_${record.year || 2026}.pdf`;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Top Decorative Brand Bar
        doc.setFillColor(33, 37, 41); // Dark Navy
        doc.rect(0, 0, pageWidth, 24, 'F');
        doc.setFillColor(10, 179, 156); // Teal Accent Stripe
        doc.rect(0, 24, pageWidth, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`${propName.toUpperCase()} MAINTENANCE PLATFORM`, 14, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225);
        doc.text('Official Monthly Maintenance Statement & Tenant Share Distribution', 14, 18);

        // 2. Property & Statement Meta Box
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Billing Cycle: ${monthName.toUpperCase()} ${record.year || 2026}`, 14, 34);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Property: ${propName}  •  Address: ${propAddress}`, 14, 40);
        doc.text(`Statement Ref: ${generateDiplomaticRef(record, activeHouse)}  •  Audited By: Property Administration  •  Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 45);

        // 3. Three Metric Highlight Cards
        const cardY = 50;
        const cardWidth = 56;
        const cardHeight = 20;
        const expenses = record.expenses || [];
        const grandTotal = record.grand_total != null ? parseFloat(record.grand_total) : (record.grandTotal != null ? parseFloat(record.grandTotal) : expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0));
        const activeTenants = 5;
        const individualContribution = (grandTotal / 5);

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
        doc.text(`${pdfCurrency} ${grandTotal.toLocaleString('en-IN')}`, 18, cardY + 14);

        // Card 2: Units
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14 + cardWidth + 5, cardY, cardWidth, cardHeight, 2, 2, 'FD');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('ACTIVE OCCUPANCY', 14 + cardWidth + 9, cardY + 6);
        doc.setFontSize(12);
        doc.setTextColor(10, 179, 156);
        doc.text(`${activeTenants} Residential Flats`, 14 + cardWidth + 9, cardY + 14);

        // Card 3: Per-Tenant Contribution Due
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(153, 246, 228);
        doc.roundedRect(14 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, 2, 2, 'FD');
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136);
        doc.text('PER-FLAT DUE SHARE', 14 + (cardWidth + 5) * 2 + 4, cardY + 6);
        doc.setFontSize(12);
        doc.setTextColor(15, 118, 110);
        doc.text(`${pdfCurrency} ${individualContribution.toFixed(2)}`, 14 + (cardWidth + 5) * 2 + 4, cardY + 14);

        // 4. Line Items Table
        const tableData = expenses.length === 0
            ? [['-', 'No expenses recorded for this billing cycle yet', '-', '0.00', '0.00', '0.00', '-']]
            : expenses.map((exp, idx) => {
                const amt = parseFloat(exp.amount || 0);
                const gst = exp.gst_amount != null ? parseFloat(exp.gst_amount) : (exp.gstAmount != null ? parseFloat(exp.gstAmount) : 0);
                const isGst = exp.gst_applicable || exp.gstApplicable;
                return [
                    (idx + 1).toString(),
                    (exp.invoice_file_name || exp.invoiceFileName) ? `${exp.particular}\n[Voucher: ${exp.invoice_file_name || exp.invoiceFileName}]` : exp.particular,
                    (exp.category || 'maintenance').toUpperCase(),
                    `${pdfCurrency} ${amt.toLocaleString('en-IN')}`,
                    isGst ? `${pdfCurrency} ${gst}` : 'Exempt',
                    `${pdfCurrency} ${(amt + gst).toLocaleString('en-IN')}`,
                    exp.added_by || exp.addedBy || 'Administrator'
                ];
            });

        doc.autoTable({
            startY: 76,
            head: [['#', 'Particulars / Description', 'Category', 'Base Amount', 'GST', 'Total Cost', 'Authorized By']],
            body: tableData,
            foot: [[
                '',
                'Grand Total Monthly Maintenance',
                '',
                '',
                '',
                `${pdfCurrency} ${grandTotal.toLocaleString('en-IN')}`,
                ''
            ]],
            theme: 'striped',
            headStyles: {
                fillColor: [64, 81, 137], // #405189 Navy
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

        // 5. Verification & Official Stamp Section
        const finalY = doc.lastAutoTable?.finalY || 160;
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
        
        const upiInfo = activeHouse.settings?.upiId
            ? `UPI to ${activeHouse.settings.upiId}${activeHouse.settings.upiName ? ` (${activeHouse.settings.upiName})` : ''} or Direct Bank Transfer (NEFT/IMPS).`
            : 'Direct Bank Transfer (NEFT/IMPS) or UPI to Property Management Account.';
        doc.text(`• Payment modes: ${upiInfo}`, 18, summaryBoxY + 15);
        doc.text(`• Individual tenant share amount: ${pdfCurrency} ${individualContribution.toFixed(2)} due per flat.`, 18, summaryBoxY + 19);
        const supportEmail = activeHouse.settings?.resendFromEmail || 'sampathkumar@chemadura.com';
        doc.text(`• For billing queries, contact Property Administration at ${supportEmail}.`, 18, summaryBoxY + 23);

        // Official Signature Block
        const sigY = summaryBoxY + 36;
        if (sigY < 275) {
            doc.setDrawColor(16, 185, 129); // Emerald
            doc.setLineWidth(0.8);
            doc.roundedRect(14, sigY, 52, 14, 1.5, 1.5, 'D');
            doc.setTextColor(5, 150, 105);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('AUDITED & CLEARED', 18, sigY + 6);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${propName} Property Mgmt`, 18, sigY + 10);

            const signatoryName = activeHouse.settings?.upiName || 'Sampath Kumar';
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text(signatoryName, pageWidth - 55, sigY + 5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text('Property Owner & Administrator', pageWidth - 55, sigY + 10);
        }

        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated electronically via ${propName} Maintenance Management Platform V0.1`, 14, 288);
        doc.text('Page 1 of 1', pageWidth - 25, 288);

        doc.save(fileName);
        if (window.audioUtils) window.audioUtils.playSuccessChime();
    }

    // 3. Export Tenant Directory to Excel
    function exportTenantsToExcel(users, house) {
        const userList = Array.isArray(users) ? users : [];
        const activeHouse = getActiveHouse(house);
        const propName = activeHouse.name || 'CHE-MADURA HS-1 MGMT';
        const propAddress = formatHouseAddress(activeHouse);
        const currency = activeHouse.settings?.currency || 'INR';
        const propertySlug = sanitizeFileName(propName);
        const fileName = `${propertySlug}_Tenants_Directory_${new Date().toISOString().split('T')[0]}.xlsx`;

        const worksheetData = [
            [`${propName.toUpperCase()} RESIDENTIAL DIRECTORY & LEASE LEDGER`],
            [`Property Address: ${propAddress}`],
            [`Generated On: ${new Date().toLocaleString('en-IN')}`],
            [],
            ['S.No', 'Flat / Unit', 'Resident Name', 'Phone', 'Email', 'Role Privilege', 'Occupancy Status', 'Rent Status', 'Maintenance Status', `Monthly Rent (${currency})`, `Security Deposit (${currency})`, 'Move-In Date', 'Emergency Contact']
        ];

        userList.forEach((user, idx) => {
            worksheetData.push([
                idx + 1,
                user.flat_number || user.flatNumber || 'GF',
                user.full_name || user.fullName || 'Resident',
                user.phone || '',
                user.email || '',
                user.role || 'TENANT',
                (user.occupancy_status || user.occupancyStatus || 'active').toUpperCase(),
                (user.payment_status || user.paymentStatus || 'unpaid').toUpperCase(),
                (user.maintenance_status || user.maintenanceStatus || 'unpaid').toUpperCase(),
                user.rent_amount || user.rentAmount || 0,
                user.deposit_amount || user.depositAmount || 0,
                user.move_in_date || user.moveInDate || '-',
                user.emergency_contact || user.emergencyContact || '-'
            ]);
        });

        worksheetData.push([]);
        const totalRent = userList.reduce((acc, u) => acc + (u.rent_amount || u.rentAmount || 0), 0);
        const totalDeposit = userList.reduce((acc, u) => acc + (u.deposit_amount || u.depositAmount || 0), 0);
        worksheetData.push(['', 'TOTAL ACTIVE UNITS', userList.length, '', '', '', '', 'PORTFOLIO TOTALS:', totalRent, totalDeposit, '', '']);

        const worksheet = window.XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 8 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 30 },
            { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 20 },
            { wch: 16 }, { wch: 18 }
        ];

        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenant Directory');
        window.XLSX.writeFile(workbook, fileName);
        if (window.audioUtils) window.audioUtils.playSuccessChime();
    }

    // 4. Export Tenant Directory to PDF
    function exportTenantsToPDF(users, house) {
        const userList = Array.isArray(users) ? users : [];
        const activeHouse = getActiveHouse(house);
        const propName = activeHouse.name || 'CHE-MADURA HS-1 MGMT';
        const propAddress = formatHouseAddress(activeHouse);
        const currency = activeHouse.settings?.currency || 'INR';
        const pdfCurrency = currency === '₹' || currency === '?' ? 'Rs.' : currency;
        const propertySlug = sanitizeFileName(propName);
        const fileName = `${propertySlug}_Tenants_Directory_${new Date().toISOString().split('T')[0]}.pdf`;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(33, 37, 41);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setFillColor(10, 179, 156);
        doc.rect(0, 20, pageWidth, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`${propName.toUpperCase()} - RESIDENTIAL OCCUPANCY & LEASE DIRECTORY`, 14, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225);
        doc.text(`Official Register • Address: ${propAddress} • Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 17);

        const tableData = userList.map((u, idx) => [
            (idx + 1).toString(),
            u.flat_number || u.flatNumber || 'GF',
            u.full_name || u.fullName || 'Resident',
            u.phone || '',
            u.email || '',
            u.role || 'TENANT',
            (u.occupancy_status || u.occupancyStatus || 'active').toUpperCase(),
            `Rent: ${(u.payment_status || u.paymentStatus || 'unpaid').toUpperCase()} | Maint: ${(u.maintenance_status || u.maintenanceStatus || 'unpaid').toUpperCase()}`,
            `${pdfCurrency} ${(u.rent_amount || u.rentAmount || 0).toLocaleString('en-IN')}`,
            `${pdfCurrency} ${(u.deposit_amount || u.depositAmount || 0).toLocaleString('en-IN')}`,
            u.emergency_contact || u.emergencyContact || '-'
        ]);

        doc.autoTable({
            startY: 28,
            head: [['#', 'Flat', 'Resident Name', 'Phone', 'Email', 'Role', 'Status', 'Payment Dues', 'Rent (mo)', 'Deposit', 'Emergency']],
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

        const finalY = doc.lastAutoTable?.finalY || 160;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Certified Confidential Property Record • ${propName} Management Platform V0.1`, 14, Math.min(finalY + 12, 195));

        doc.save(fileName);
        if (window.audioUtils) window.audioUtils.playSuccessChime();
    }

    // 5. Export Audit Logs to CSV
    function exportAuditLogsToCSV(logs, house) {
        const logList = Array.isArray(logs) ? logs : [];
        const activeHouse = getActiveHouse(house);
        const propName = activeHouse.name || 'CHE-MADURA HS-1 MGMT';
        const propertySlug = sanitizeFileName(propName);
        const fileName = `${propertySlug}_Security_Audit_${new Date().toISOString().split('T')[0]}.csv`;

        const headers = ['Log ID', 'User Email', 'Action Performed', 'Resource Type', 'Resource ID', 'Client IP', 'Timestamp'];
        const rows = logList.map((l) => [
            `"${l.id}"`,
            `"${l.user_email || l.userEmail || ''}"`,
            `"${l.action || ''}"`,
            `"${l.resource_type || l.resourceType || ''}"`,
            `"${l.resource_id || l.resourceId || '-'}"`,
            `"${l.ip_address || l.ipAddress || '0.0.0.0'}"`,
            `"${new Date(l.timestamp || Date.now()).toISOString()}"`
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
        if (window.audioUtils) window.audioUtils.playSuccessChime();
    }

    window.exportUtils = {
        exportPDF: exportMaintenanceToPDF,
        exportExcel: exportMaintenanceToExcel,
        exportMaintenanceToPDF,
        exportMaintenanceToExcel,
        exportTenantsToExcel,
        exportTenantsToPDF,
        exportAuditLogsToCSV
    };
})();
