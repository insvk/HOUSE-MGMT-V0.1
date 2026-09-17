import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The existing subscribeToExpenses is around line 395-460.
// Let's find the end of the `subscribeToExpenses` block where the cleanup happens:
/*
    return () => {
      unsubscribe();
      authListener?.subscription?.unsubscribe();
    };
*/

const target = `    return () => {
      unsubscribe();
      authListener?.subscription?.unsubscribe();
    };`;

const replacement = `    // Users Table Subscription
    const usersChannel = supabase
      .channel('realtime:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        // Simple reload for users on change
        handleSyncCloudDb();
      })
      .subscribe();

    // Invoices Table Subscription
    const invoicesChannel = supabase
      .channel('realtime:invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        handleSyncCloudDb();
      })
      .subscribe();

    // Houses Table Subscription
    const housesChannel = supabase
      .channel('realtime:houses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, () => {
        handleSyncCloudDb();
      })
      .subscribe();

    return () => {
      unsubscribe();
      authListener?.subscription?.unsubscribe();
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(housesChannel);
    };`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Realtime added!');
