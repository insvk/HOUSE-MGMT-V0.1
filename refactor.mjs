import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. handleAddExpense
content = content.replace(
  `  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'createdAt'>) => {`,
  `  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'createdAt'>) => {`
).replace(
  `    cloudDb.addExpense(newExpense).catch(() => {});\n    playSuccessChime();\n    showToast(\`Added expense "\${newExpenseData.particular}" (₹\${newExpenseData.amount.toLocaleString('en-IN')})\`);`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.addExpense(newExpense);
      if (!success) {
        setRecords((prev) =>
          prev.map((r) => {
            if (r.id === activeRecord.id) {
              const updatedExpenses = r.expenses.filter((e) => e.id !== expenseId);
              const newGrandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
              const newContribution = newGrandTotal / (r.activeTenantsCount || 5);
              return { ...r, expenses: updatedExpenses, grandTotal: newGrandTotal, individualContribution: newContribution };
            }
            return r;
          })
        );
        showToast('Error: Failed to save expense to Cloud DB. Changes reverted.');
        playWarningChime();
        return;
      }
    }
    playSuccessChime();
    showToast(\`Added expense "\${newExpenseData.particular}" (₹\${newExpenseData.amount.toLocaleString('en-IN')})\`);`
);

// 2. handleSaveEditedExpense
content = content.replace(
  `  const handleSaveEditedExpense = (updatedExpense: Expense) => {`,
  `  const handleSaveEditedExpense = async (updatedExpense: Expense) => {`
).replace(
  `    cloudDb.updateExpense(updatedExpense).catch(() => {});\n    playSuccessChime();\n    showToast(\`Updated expense "\${updatedExpense.particular}"\`);`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.updateExpense(updatedExpense);
      if (!success) {
        // Rollback is complex here without storing the original. Instead we trigger a sync to pull true state.
        handleSyncCloudDb();
        showToast('Error: Failed to update expense in Cloud DB. Synchronizing state.');
        playWarningChime();
        return;
      }
    }
    playSuccessChime();
    showToast(\`Updated expense "\${updatedExpense.particular}"\`);`
);

// 3. handleDeleteExpense
content = content.replace(
  `  const handleDeleteExpense = (expenseId: string) => {`,
  `  const handleDeleteExpense = async (expenseId: string) => {`
).replace(
  `    cloudDb.deleteExpense(expenseId).catch(() => {});\n    playWarningChime();\n    showToast('Deleted line item expense.');`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.deleteExpense(expenseId);
      if (!success) {
        handleSyncCloudDb();
        showToast('Error: Failed to delete expense in Cloud DB. Synchronizing state.');
        playWarningChime();
        return;
      }
    }
    playWarningChime();
    showToast('Deleted line item expense.');`
);

// 4. handleAddUser
content = content.replace(
  `  const handleAddUser = (userData: Omit<User, 'id'>) => {`,
  `  const handleAddUser = async (userData: Omit<User, 'id'>) => {`
).replace(
  `    cloudDb.createUser(newUser).catch(() => {});\n    playSuccessChime();\n    showToast(\`Registered resident \${userData.fullName} (\${userData.flatNumber})\`);`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.createUser(newUser);
      if (!success) {
        setUsers((prev) => prev.filter(u => u.id !== newUser.id));
        showToast('Error: Failed to register user in Cloud DB. Changes reverted.');
        playWarningChime();
        return;
      }
    }
    playSuccessChime();
    showToast(\`Registered resident \${userData.fullName} (\${userData.flatNumber})\`);`
);

// 5. handleUpdateUser
content = content.replace(
  `  const handleUpdateUser = (updatedUser: User) => {`,
  `  const handleUpdateUser = async (updatedUser: User) => {`
).replace(
  `    cloudDb.updateUser(updatedUser).catch(() => {});\n\n    const newAudit`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.updateUser(updatedUser);
      if (!success) {
        handleSyncCloudDb();
        showToast('Error: Failed to update user in Cloud DB. Synchronizing state.');
        playWarningChime();
        return;
      }
    }\n\n    const newAudit`
);

// 6. handleDeleteUser
content = content.replace(
  `  const handleDeleteUser = (userId: string) => {`,
  `  const handleDeleteUser = async (userId: string) => {`
).replace(
  `    cloudDb.deleteUser(userId).catch(() => {});\n    playWarningChime();\n    showToast(\`Deleted resident \${targetUser?.fullName || userId}\`);`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.deleteUser(userId);
      if (!success) {
        handleSyncCloudDb();
        showToast('Error: Failed to delete user in Cloud DB. Synchronizing state.');
        playWarningChime();
        return;
      }
    }
    playWarningChime();
    showToast(\`Deleted resident \${targetUser?.fullName || userId}\`);`
);

// 7. handleSaveHouseSettings
content = content.replace(
  `  const handleSaveHouseSettings = (updatedHouse: House) => {`,
  `  const handleSaveHouseSettings = async (updatedHouse: House) => {`
).replace(
  `    cloudDb.updateHouse(updatedHouse).catch(() => {});\n\n    const newAudit`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.updateHouse(updatedHouse);
      if (!success) {
        handleSyncCloudDb();
        showToast('Error: Failed to save house settings in Cloud DB.');
        playWarningChime();
        return;
      }
    }\n\n    const newAudit`
);

// 8. handleSaveCurrentUserAvatar (already async!)
content = content.replace(
  `    try {\n      await cloudDb.updateUserAvatar(currentUser.email, newAvatarUrl);\n    } catch (e) {\n      console.warn('Cloud DB avatar update fallback:', e);\n    }`,
  `    if (isSupabaseConfigured) {
      const success = await cloudDb.updateUserAvatar(currentUser.email, newAvatarUrl);
      if (!success) {
        handleSyncCloudDb();
        showToast('Error: Failed to save avatar to Cloud DB.');
        playWarningChime();
        return;
      }
    }`
);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Refactoring complete!');
