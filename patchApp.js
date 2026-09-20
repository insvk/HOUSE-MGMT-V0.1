const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('const [toastMessage, setToastMessage] = useState<string | null>(null);', 
  `const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleMasterCloudSync = async () => {
    setIsSyncing(true);
    try {
      const res = await cloudDb.syncAllDataToCloud({
        house,
        users,
        record: activeRecord,
        expenses: activeRecord.expenses,
      });
      if (res.success) {
        showToast('All changes permanently locked and saved in Cloud PostgreSQL!');
      } else {
        showToast('Failed to sync. Please try again.');
      }
    } catch (e) {
      console.error(e);
      showToast('Error syncing data.');
    } finally {
      setIsSyncing(false);
    }
  };`);

content = content.replace(/<Dashboard\n                house=\{house\}\n                currentUser=\{currentUser\}/g, 
  `<Dashboard
                house={house}
                currentUser={currentUser}
                onMasterCloudSync={handleMasterCloudSync}
                isSyncing={isSyncing}`);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx patched!');
