import { drizzle } from "drizzle-orm/mysql2";
import { excelFiles, excelSheetData } from "../drizzle/schema";
import XLSX from "xlsx";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function reparseExcel() {
  try {
    const files = await db.select().from(excelFiles);
    console.log(`找到 ${files.length} 個檔案`);

    for (const file of files) {
      console.log(`\n處理檔案: ${file.fileName} (ID: ${file.id})`);

      // 從 S3 下載檔案
      const response = await fetch(file.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 解析 Excel
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetNames = workbook.SheetNames;
      console.log(`  工作表數量: ${sheetNames.length}`);

      // 刪除舊的 sheet data
      await db.delete(excelSheetData).where(eq(excelSheetData.fileId, file.id));

      let totalRows = 0;
      let totalCols = 0;

      for (let i = 0; i < sheetNames.length; i++) {
        const sheetName = sheetNames[i];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        console.log(`  工作表 "${sheetName}": ${jsonData.length} 列`);

        if (jsonData.length > 0) {
          const headers = jsonData[0] as any[];
          const rows = jsonData.slice(1);

          totalRows += rows.length;
          totalCols = Math.max(totalCols, headers.length);

          await db.insert(excelSheetData).values({
            fileId: file.id,
            sheetName,
            sheetIndex: i,
            headers: JSON.stringify(headers),
            data: JSON.stringify(rows),
            rowCount: rows.length,
            columnCount: headers.length,
          });

          console.log(`    ✓ 儲存 ${rows.length} 列數據`);
        }
      }

      // 更新檔案元數據
      await db
        .update(excelFiles)
        .set({
          sheetNames: JSON.stringify(sheetNames),
          rowCount: totalRows,
          columnCount: totalCols,
          status: "completed",
        })
        .where(eq(excelFiles.id, file.id));

      console.log(`  ✓ 完成`);
    }

    console.log("\n✅ 所有檔案重新解析完成");
    process.exit(0);
  } catch (error) {
    console.error("❌ 錯誤:", error);
    process.exit(1);
  }
}

reparseExcel();
