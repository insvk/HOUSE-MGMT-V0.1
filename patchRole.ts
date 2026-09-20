import { cloudDb } from './src/lib/supabaseClient.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('Fetching rsivanaresh@gmail.com...');
  const user = await cloudDb.getUserByEmail('rsivanaresh@gmail.com');
  if (user) {
    user.role = 'ADMIN_TENANT';
    user.fullName = 'SIVA R';
    const res = await cloudDb.updateUser(user);
    console.log('Update result:', res);
  } else {
    console.log('User not found in Cloud DB. It might just be local.');
  }
}
run();
