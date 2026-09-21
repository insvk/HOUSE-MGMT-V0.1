// Real implementation of jsPDF / SheetJS export ports

window.exportUtils = {
    exportPDF: function(records, house) {
        if (!records || records.length === 0) {
            alert("No records to export.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const currentRecord = records[0];
        const expenses = currentRecord.expenses || [];

        // Title
        doc.setFontSize(18);
        doc.text("MADURA HOUSE MAINTENANCE REPORT", 14, 22);

        // Subtitle
        doc.setFontSize(12);
        const monthName = getMonthName(currentRecord.month);
        doc.text(`Period: ${monthName} ${currentRecord.year}`, 14, 30);
        
        // Summary
        doc.setFontSize(11);
        doc.text(`Total Expenses: Rs. ${parseFloat(currentRecord.grand_total).toLocaleString('en-IN')}`, 14, 40);
        const perTenant = currentRecord.individual_contribution || (currentRecord.grand_total / (currentRecord.number_of_active_tenants || 5));
        doc.text(`Contribution Per Tenant: Rs. ${parseFloat(perTenant).toLocaleString('en-IN')}`, 14, 46);

        // Table Data
        const tableBody = expenses.map(e => [
            e.particular,
            e.category || 'Maintenance',
            new Date(e.created_at).toLocaleDateString(),
            `Rs. ${parseFloat(e.amount).toLocaleString('en-IN')}`
        ]);

        doc.autoTable({
            startY: 55,
            head: [['Particulars', 'Category', 'Date', 'Amount']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        const fileName = `Madura_House_Report_${monthName}_${currentRecord.year}.pdf`;
        doc.save(fileName);
    },
    
    exportExcel: function(records) {
        if (!records || records.length === 0) {
            alert("No records to export.");
            return;
        }

        const currentRecord = records[0];
        const expenses = currentRecord.expenses || [];

        // Flatten data for Excel
        const data = expenses.map(e => ({
            'Particulars': e.particular,
            'Category': e.category || 'Maintenance',
            'Date': new Date(e.created_at).toLocaleDateString(),
            'Amount (Rs)': parseFloat(e.amount)
        }));

        // Add Summary Row
        data.push({
            'Particulars': 'GRAND TOTAL',
            'Category': '',
            'Date': '',
            'Amount (Rs)': parseFloat(currentRecord.grand_total)
        });

        const worksheet = window.XLSX.utils.json_to_sheet(data);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

        const monthName = getMonthName(currentRecord.month);
        const fileName = `Madura_House_Report_${monthName}_${currentRecord.year}.xlsx`;
        window.XLSX.writeFile(workbook, fileName);
    }
};

function getMonthName(monthNumber) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[monthNumber - 1] || "";
}
