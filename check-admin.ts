import { drizzle } from "drizzle-orm/mysql2";
import { localUsers } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function checkAdmin() {
  try {
    const users = await db.select().from(localUsers);
    console.log("資料庫中的使用者:");
    users.forEach((u) => {
      console.log(`  ID: ${u.id}, 帳號: ${u.username}, 角色: ${u.role}`);
    });

    if (users.length === 0) {
      console.log("\n⚠️  資料庫中沒有任何使用者!");
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ 查詢失敗:", error);
    process.exit(1);
  }
}

checkAdmin();
