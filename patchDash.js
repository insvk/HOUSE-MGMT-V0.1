const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Pass house to exports
content = content.replace(/exportMaintenanceToExcel\(currentRecord\)/g, 'exportMaintenanceToExcel(currentRecord, house)');
content = content.replace(/exportMaintenanceToPDF\(currentRecord\)/g, 'exportMaintenanceToPDF(currentRecord, house)');

// 2. Change currency in the UI from hardcoded
content = content.split('\u20B9{rentAmount.toLocaleString(\'en-IN\')}').join('{house?.settings?.currency || \'\u20B9\'}{rentAmount.toLocaleString(\'en-IN\')}');
content = content.split('\u20B9{maintAmount.toLocaleString(\'en-IN\')}').join('{house?.settings?.currency || \'\u20B9\'}{maintAmount.toLocaleString(\'en-IN\')}');
content = content.split('\u20B9{totalDue.toLocaleString(\'en-IN\')}').join('{house?.settings?.currency || \'\u20B9\'}{totalDue.toLocaleString(\'en-IN\')}');
content = content.split('\u20B9{currentRecord.grandTotal.toLocaleString(\'en-IN\')}').join('{house?.settings?.currency || \'\u20B9\'}{currentRecord.grandTotal.toLocaleString(\'en-IN\')}');
content = content.split('\u20B9{(isRentPaid ? 0 : rentAmount).toLocaleString(\'en-IN\')}').join('{house?.settings?.currency || \'\u20B9\'}{(isRentPaid ? 0 : rentAmount).toLocaleString(\'en-IN\')}');
content = content.split('\u20B9{(isMaintPaid ? 0 : maintAmount).toLocaleString(\'en-IN\')}').join('{house?.settings?.currency || \'\u20B9\'}{(isMaintPaid ? 0 : maintAmount).toLocaleString(\'en-IN\')}');

// Also the UPI ID text
content = content.split('sampathkumar@chemadura.com').join('{house?.settings?.upiId || \'sampathkumar@chemadura.com\'}');

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
console.log('Done patching Dashboard!');
