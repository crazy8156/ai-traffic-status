import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { localUsers } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function testLogin() {
  const users = await db.select().from(localUsers).where(eq(localUsers.username, 'admin'));

  if (users.length > 0) {
    const user = users[0];
    console.log('Admin user found:', { id: user.id, username: user.username, role: user.role });
    
    const isValid = await bcrypt.compare('admin', user.passwordHash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('Password hash is incorrect, updating...');
      const newHash = await bcrypt.hash('admin', 10);
      await db.update(localUsers)
        .set({ passwordHash: newHash })
        .where(eq(localUsers.id, user.id));
      console.log('Password updated successfully');
    }
  } else {
    console.log('Admin user not found');
  }
}

testLogin().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
