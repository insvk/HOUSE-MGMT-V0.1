const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the duplicated isSyncing block
content = content.replace(/  const \[isSyncing, setIsSyncing\] = useState\(false\);\n\n  const handleMasterCloudSync = async \(\) => \{\n    setIsSyncing\(true\);\n    try \{\n      const res = await cloudDb\.syncAllDataToCloud\(\{\n        house,\n        users,\n        record: activeRecord,\n        expenses: activeRecord\.expenses,\n      \}\);\n      if \(res\.success\) \{\n        showToast\('All changes permanently locked and saved in Cloud PostgreSQL!'\);\n      \} else \{\n        showToast\('Failed to sync\. Please try again\.'\);\n      \}\n    \} catch \(e\) \{\n      console\.error\(e\);\n      showToast\('Error syncing data\.'\);\n    \} finally \{\n      setIsSyncing\(false\);\n    \}\n  \};\n/g, '');

// Fix the theme errors
content = content.replace(/theme: newTheme/g, '/* theme removed */');
content = content.replace(/currentUser\.preferences\?\.theme/g, '/* theme removed */ undefined');
content = content.replace(/theme: newTheme,/g, '');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx deduplicated and fixed!');
