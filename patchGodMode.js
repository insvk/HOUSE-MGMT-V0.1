const fs = require('fs');
let content = fs.readFileSync('src/components/GodModeMasterModal.tsx', 'utf8');

// Add state variables
content = content.replace('const [houseName, setHouseName] = useState(house?.name || \'\');', 
  `const [houseName, setHouseName] = useState(house?.name || '');
  const [houseCurrency, setHouseCurrency] = useState(house?.settings?.currency || '₹');
  const [houseUpiId, setHouseUpiId] = useState(house?.settings?.upiId || '');
  const [houseUpiName, setHouseUpiName] = useState(house?.settings?.upiName || '');`);

// Update handleSaveHouse
content = content.replace('address: houseAddress,', 
  `address: houseAddress,
      settings: {
        ...house?.settings,
        currency: houseCurrency,
        upiId: houseUpiId,
        upiName: houseUpiName
      },`);

// Add inputs to UI right before the Save button
const inputs = `
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Platform Currency Symbol</label>
                    <select
                      value={houseCurrency}
                      onChange={(e) => setHouseCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-semibold"
                    >
                      <option value="₹">₹ (INR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="£">£ (GBP)</option>
                      <option value="Rs.">Rs.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official UPI ID for Rent</label>
                    <input
                      type="text"
                      value={houseUpiId}
                      onChange={(e) => setHouseUpiId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                      placeholder="e.g. sampathkumar@chemadura.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">UPI Payee Name (Optional)</label>
                    <input
                      type="text"
                      value={houseUpiName}
                      onChange={(e) => setHouseUpiName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                      placeholder="e.g. Sampath Kumar"
                    />
                  </div>
                </div>
`;

content = content.replace(/<div className="pt-4 flex justify-end gap-3 border-t border-slate-100">/g, 
  `${inputs}\n                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">`);

// Replace the weird dY? character that was corrupted in 3d5f090 as well, if any? Wait, it was dY? in the logs! 
// Let's replace "dY?" with "✨"
content = content.replace(/dY\?/g, '✨');

fs.writeFileSync('src/components/GodModeMasterModal.tsx', content, 'utf8');
console.log('GodMode patched!');
