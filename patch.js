const fs = require('fs');
let content = fs.readFileSync('src/utils/exportUtils.ts', 'utf8');

content = content.replace('Base Amount (INR)', 'Base Amount (${currency})');
content = content.replace('GST Amount (INR)', 'GST Amount (${currency})');
content = content.replace('Total Amount (INR)', 'Total Amount (${currency})');
content = content.replace('Monthly Rent (INR)', 'Monthly Rent (${currency})');
content = content.replace('Security Deposit (INR)', 'Security Deposit (${currency})');

content = content.replace(/Rs\. \$\{record\.grandTotal\.toLocaleString\('en-IN'\)\}/g, '${pdfCurrency} ${record.grandTotal.toLocaleString(\'en-IN\')}');
content = content.replace(/Rs\. \$\{record\.individualContribution\.toFixed\(2\)\}/g, '${pdfCurrency} ${record.individualContribution.toFixed(2)}');
content = content.replace(/Rs\. \$\{exp\.amount\.toLocaleString\('en-IN'\)\}/g, '${pdfCurrency} ${exp.amount.toLocaleString(\'en-IN\')}');
content = content.replace(/Rs\. \$\{exp\.gstAmount \|\| 0\}/g, '${pdfCurrency} ${exp.gstAmount || 0}');
content = content.replace(/Rs\. \$\{\(exp\.amount \+ \(exp\.gstAmount \|\| 0\)\)\.toLocaleString\('en-IN'\)\}/g, '${pdfCurrency} ${(exp.amount + (exp.gstAmount || 0)).toLocaleString(\'en-IN\')}');

content = content.replace(/Rs\. \$\{\(u\.rentAmount \|\| 0\)\.toLocaleString\('en-IN'\)\}/g, '${pdfCurrency} ${(u.rentAmount || 0).toLocaleString(\'en-IN\')}');
content = content.replace(/Rs\. \$\{\(u\.depositAmount \|\| 0\)\.toLocaleString\('en-IN'\)\}/g, '${pdfCurrency} ${(u.depositAmount || 0).toLocaleString(\'en-IN\')}');

content = content.replace('export const exportMaintenanceToExcel = (record: MaintenanceRecord, house?: House) => {', 
  'export const exportMaintenanceToExcel = (record: MaintenanceRecord, house?: House) => {\n  const currency = house?.settings?.currency || \'INR\';');

content = content.replace('export const exportTenantsToExcel = (users: User[], house?: House) => {', 
  'export const exportTenantsToExcel = (users: User[], house?: House) => {\n  const currency = house?.settings?.currency || \'INR\';');

content = content.replace('export const exportMaintenanceToPDF = (record: MaintenanceRecord, house?: House) => {', 
  'export const exportMaintenanceToPDF = (record: MaintenanceRecord, house?: House) => {\n  const currency = house?.settings?.currency || \'INR\';\n  const pdfCurrency = currency === \'?\' ? \'Rs.\' : currency;');

content = content.replace('export const exportTenantsToPDF = (users: User[], house?: House) => {', 
  'export const exportTenantsToPDF = (users: User[], house?: House) => {\n  const currency = house?.settings?.currency || \'INR\';\n  const pdfCurrency = currency === \'?\' ? \'Rs.\' : currency;');

content = content.replace(/  doc\.text\('Certified Confidential Property Record/g, 
  `  if (house?.settings?.upiId) {\n    doc.text(\`  Please remit your maintenance contribution to UPI ID: \${house.settings.upiId} \${house.settings.upiName ? \`(\${house.settings.upiName})\` : ''}\`, 18, (doc as any).lastAutoTable?.finalY ? Math.min((doc as any).lastAutoTable.finalY + 8, 230) + 15 : 245);\n  }\n  doc.text('Certified Confidential Property Record`);

fs.writeFileSync('src/utils/exportUtils.ts', content, 'utf8');
console.log('Done!');
