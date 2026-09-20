const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://kbvjnshgyuwkcvicwefh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtidmpuc2hneXV3a2N2aWN3ZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjQ0NTIsImV4cCI6MjEwNDI0MDQ1Mn0.ysi0SnVJfD5L2M_r2twp06oBRbMq7U-K8vRGcqU_XJg');

async function run() {
  console.log('Fetching rsivanaresh@gmail.com...');
  const { data, error } = await supabase.from('users').select('*').eq('email', 'rsivanaresh@gmail.com').single();
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  if (data) {
    console.log('Found user:', data);
    const { error: updateError } = await supabase.from('users').update({
      role: 'ADMIN_TENANT',
      full_name: 'SIVA R'
    }).eq('email', 'rsivanaresh@gmail.com');
    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Successfully permanently updated role to ADMIN_TENANT in Cloud DB!');
    }
  } else {
    console.log('User not found.');
  }
}
run();
