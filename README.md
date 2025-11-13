# 財務報表分析平台

一個功能完整的財務報表管理與分析系統,支援 Excel 檔案上傳、資料視覺化、AI 智能分析等功能。

## 功能特色

### 前台功能 (公開存取)
- 📊 **報表視覺化**: 支援圓餅圖、柱狀圖、折線圖、面積圖
- 🎯 **智能欄位選擇**: 自動識別達麗報表格式,預設最佳欄位組合
- 🔍 **資料篩選**: 支援關鍵字篩選圖表數據
- 📥 **圖表匯出**: 支援 PNG 和 PDF 格式匯出
- 🤖 **AI 智能分析**: 使用 ChatGPT 進行報表分析與問答
- 📱 **響應式設計**: 完美支援手機版和電腦版

### 後台功能 (需登入)
- 📤 **檔案上傳**: 支援 Excel 檔案上傳,附帶進度條顯示
- 📁 **檔案管理**: 查看、刪除已上傳的檔案
- 📈 **AI 使用分析**: 查看 API 使用統計與 Token 用量
- 💬 **AI 問題對話**: 後台專用的 AI 對話功能
- 🏠 **快速導航**: 一鍵回到首頁

## 技術架構

### 前端
- **框架**: React 19 + TypeScript
- **路由**: Wouter
- **樣式**: Tailwind CSS 4 + shadcn/ui
- **圖表**: Recharts
- **狀態管理**: TanStack Query (via tRPC)
- **建置工具**: Vite

### 後端
- **框架**: Express 4 + TypeScript
- **API**: tRPC 11 (端到端型別安全)
- **認證**: JWT + bcrypt
- **資料庫**: MySQL/TiDB (via Drizzle ORM)
- **檔案儲存**: S3 相容儲存
- **AI 整合**: OpenAI GPT-4

### 資料庫
- **ORM**: Drizzle ORM
- **遷移**: `pnpm db:push`
- **資料表**:
  - `local_users`: 本地使用者認證
  - `excel_files`: Excel 檔案元資料
  - `excel_sheet_data`: Excel 工作表數據
  - `ai_conversations`: AI 對話記錄
  - `ai_usage_logs`: AI API 使用日誌

## 快速開始

### 1. 安裝依賴

```bash
pnpm install
```

### 2. 設定環境變數

建立 `.env` 檔案:

```bash
# 資料庫
DATABASE_URL=mysql://user:password@host:3306/database

# JWT 認證
JWT_SECRET=your-secret-key-here

# OpenAI API
OPENAI_API_KEY=sk-...

# S3 儲存
S3_ENDPOINT=https://...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_REGION=auto
```

### 3. 執行資料庫遷移

```bash
pnpm db:push
```

### 4. 建立管理員帳號

```bash
npx tsx scripts/fix-admin.ts
```

預設帳號: `admin` / `admin`

### 5. 啟動開發伺服器

```bash
pnpm dev
```

前端: http://localhost:5173  
後端: http://localhost:3000

## 專案結構

```
financial_report_hub/
├── client/                 # 前端代碼
│   ├── public/            # 靜態資源
│   ├── src/
│   │   ├── components/    # UI 組件
│   │   ├── pages/         # 頁面組件
│   │   ├── lib/           # tRPC 客戶端
│   │   └── App.tsx        # 路由設定
│   └── index.html
├── server/                # 後端代碼
│   ├── _core/            # 核心功能 (OAuth, LLM, 儲存)
│   ├── db.ts             # 資料庫查詢函數
│   └── routers.ts        # tRPC 路由定義
├── drizzle/              # 資料庫 Schema
│   └── schema.ts
├── scripts/              # 工具腳本
│   ├── init-admin.ts     # 初始化管理員
│   └── fix-admin.ts      # 修復管理員帳號
└── shared/               # 共用常數與型別
```

## 使用說明

### 前台使用

1. 訪問首頁,無需登入
2. 選擇已上傳的 Excel 檔案
3. 選擇圖表類型 (圓餅圖、柱狀圖等)
4. 調整 X 軸和 Y 軸欄位索引
5. 點擊「快速分析」生成圖表
6. 使用篩選器過濾數據
7. 點擊「PNG」或「PDF」匯出圖表
8. 在右側 AI 對話框詢問報表相關問題

### 後台使用

1. 點擊右上角「管理者登入」
2. 輸入帳號密碼 (admin/admin)
3. 進入後台管理介面
4. **上傳檔案**: 拖放或選擇 Excel 檔案上傳
5. **檔案管理**: 查看已上傳檔案列表,可刪除檔案
6. **AI 使用分析**: 查看 API 使用統計
7. **AI 問題對話**: 後台專用的 AI 對話功能
8. 點擊「回到首頁」返回前台

## API 文件

本專案使用 tRPC,所有 API 都有完整的型別定義。

### 主要 API 路由

- `auth.login`: 登入
- `auth.logout`: 登出
- `auth.me`: 取得當前使用者
- `files.list`: 取得檔案列表
- `files.upload`: 上傳檔案
- `files.delete`: 刪除檔案
- `reports.analyzeFile`: 分析報表生成圖表
- `reports.getSheets`: 取得工作表列表
- `chat.sendMessage`: 發送 AI 對話訊息
- `aiStatus.getUsageStats`: 取得 AI 使用統計

## 部署

詳細部署指引請參閱 [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

### 快速部署到 Cloudflare

```bash
# 1. 建置前端
cd client && npm run build

# 2. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name financial-report-hub

# 3. 部署後端到 Render/Railway 等平台
```

## 開發指南

### 新增功能

1. **新增資料表**: 編輯 `drizzle/schema.ts`
2. **新增資料庫查詢**: 編輯 `server/db.ts`
3. **新增 API**: 編輯 `server/routers.ts`
4. **新增頁面**: 在 `client/src/pages/` 建立組件
5. **新增路由**: 編輯 `client/src/App.tsx`

### 資料庫遷移

```bash
# 推送 schema 變更到資料庫
pnpm db:push

# 生成遷移檔案 (可選)
pnpm drizzle-kit generate
```

### 程式碼風格

- 使用 TypeScript strict mode
- 使用 ESLint + Prettier
- 遵循 React Hooks 規則
- 使用 tRPC 進行型別安全的 API 呼叫

## 常見問題

### Q: 登入失敗怎麼辦?

A: 執行 `npx tsx scripts/fix-admin.ts` 重新建立管理員帳號。

### Q: 檔案上傳失敗?

A: 檢查 S3 環境變數是否設定正確,以及 Bucket 權限。

### Q: AI 分析沒有回應?

A: 檢查 `OPENAI_API_KEY` 是否設定正確,以及 API 額度是否足夠。

### Q: 圖表顯示 "No Data"?

A: 檢查選擇的欄位索引是否正確,以及 Excel 數據格式。

## 授權

MIT License

## 聯絡資訊

如有問題或建議,請開 Issue 或 Pull Request。

---

**注意**: 本專案預設使用 admin/admin 作為管理員帳號,部署到生產環境前請務必修改密碼!
