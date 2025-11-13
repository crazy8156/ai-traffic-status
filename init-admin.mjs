import { drizzle } from "drizzle-orm/mysql2";
import { localUsers } from "../drizzle/schema.js";
import bcrypt from "bcryptjs";

const db = drizzle(process.env.DATABASE_URL);

async function initAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("admin", 10);
    
    await db.insert(localUsers).values({
      username: "admin",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
    }).onDuplicateKeyUpdate({
      set: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
    
    console.log("✅ 預設管理員帳號已建立");
    console.log("   帳號: admin");
    console.log("   密碼: admin");
    process.exit(0);
  } catch (error) {
    console.error("❌ 建立管理員帳號失敗:", error);
    process.exit(1);
  }
}

initAdmin();
