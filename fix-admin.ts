import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { localUsers } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function fixAdmin() {
  // 刪除舊的 admin 帳號
  await db.delete(localUsers).where(eq(localUsers.username, 'admin'));
  console.log('Old admin user deleted');
  
  // 建立新的 admin 帳號
  const passwordHash = await bcrypt.hash('admin', 10);
  await db.insert(localUsers).values({
    username: 'admin',
    password: passwordHash,
    name: '系統管理員',
    role: 'admin',
  });
  
  console.log('New admin user created successfully');
  console.log('Username: admin');
  console.log('Password: admin');
  
  // 驗證
  const users = await db.select().from(localUsers).where(eq(localUsers.username, 'admin'));
  if (users.length > 0) {
    const user = users[0];
    const isValid = await bcrypt.compare('admin', user.password);
    console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
  }
}

fixAdmin().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
