# Cloudflare 部署指引

本專案可部署至 Cloudflare Pages (前端) 和 Cloudflare Workers (後端),以下是完整部署步驟。

## 架構說明

- **前端**: React + Vite → Cloudflare Pages
- **後端**: Express + tRPC → Cloudflare Workers (或其他 Node.js 主機)
- **資料庫**: MySQL/TiDB (需外部主機)
- **檔案儲存**: S3 相容儲存 (已整合)

## 方案一: Cloudflare Pages + 外部後端

### 1. 部署前端到 Cloudflare Pages

```bash
# 1. 安裝 Wrangler CLI
npm install -g wrangler

# 2. 登入 Cloudflare
wrangler login

# 3. 建置前端
cd client
npm run build

# 4. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name financial-report-hub
```

### 2. 設定環境變數

在 Cloudflare Pages 設定以下環境變數:

```
VITE_API_URL=https://your-backend-api.com
VITE_APP_TITLE=財務報表分析平台
VITE_APP_LOGO=/logo.png
```

### 3. 部署後端到其他主機

後端需要 Node.js 環境,可選擇:
- **Render.com** (推薦,免費方案)
- **Railway.app**
- **Heroku**
- **AWS EC2 / DigitalOcean**

部署步驟 (以 Render 為例):

1. 連接 GitHub repository
2. 選擇 Web Service
3. 設定 Build Command: `pnpm install`
4. 設定 Start Command: `pnpm start`
5. 設定環境變數 (見下方)

## 方案二: 完整 Cloudflare Workers 部署

Cloudflare Workers 支援 Node.js runtime,但需要調整部分代碼:

### 1. 安裝依賴

```bash
npm install -g wrangler
```

### 2. 建立 wrangler.toml

```toml
name = "financial-report-hub-api"
main = "server/_core/index.ts"
compatibility_date = "2024-01-01"
node_compat = true

[vars]
NODE_ENV = "production"
```

### 3. 部署

```bash
wrangler deploy
```

## 必要環境變數

### 後端環境變數

```bash
# 資料庫
DATABASE_URL=mysql://user:password@host:3306/database

# JWT 認證
JWT_SECRET=your-secret-key-here

# OpenAI API (用於 AI 分析)
OPENAI_API_KEY=sk-...

# S3 儲存 (如使用 Cloudflare R2)
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=financial-reports
S3_REGION=auto
```

### 前端環境變數

```bash
VITE_API_URL=https://your-backend-url.com
VITE_APP_TITLE=財務報表分析平台
VITE_APP_LOGO=/logo.png
```

## Cloudflare R2 設定 (檔案儲存)

Cloudflare R2 是 S3 相容的物件儲存服務,價格比 AWS S3 更便宜。

### 1. 建立 R2 Bucket

1. 登入 Cloudflare Dashboard
2. 進入 R2 Object Storage
3. 建立新 Bucket: `financial-reports`
4. 設定公開存取 (如需直接存取檔案)

### 2. 取得 API Token

1. 進入 R2 設定
2. 建立 API Token
3. 記錄 Access Key ID 和 Secret Access Key

### 3. 更新環境變數

將 R2 的 endpoint 和 credentials 設定到後端環境變數。

## 資料庫設定

### 選項 1: PlanetScale (推薦)

- 免費方案提供 5GB 儲存
- MySQL 相容
- 全球分散式
- 網址: https://planetscale.com

### 選項 2: TiDB Cloud

- 免費方案提供 5GB 儲存
- MySQL 相容
- 支援 Serverless
- 網址: https://tidbcloud.com

### 選項 3: Cloudflare D1

- Cloudflare 自家 SQLite 資料庫
- 需要調整 schema (從 MySQL 轉換為 SQLite)

## 部署檢查清單

- [ ] 前端建置成功 (`npm run build`)
- [ ] 後端環境變數設定完成
- [ ] 資料庫連線測試成功
- [ ] S3/R2 儲存設定完成
- [ ] OpenAI API Key 設定完成
- [ ] 執行資料庫遷移 (`pnpm db:push`)
- [ ] 建立 admin 帳號 (`npx tsx scripts/fix-admin.ts`)
- [ ] 測試登入功能
- [ ] 測試檔案上傳功能
- [ ] 測試 AI 分析功能

## 效能優化建議

1. **啟用 Cloudflare CDN**: 自動快取靜態資源
2. **啟用 Brotli 壓縮**: 減少傳輸大小
3. **設定 Cache Rules**: 快取 API 回應 (適用於不常變動的資料)
4. **使用 Cloudflare Images**: 自動優化圖片大小和格式

## 監控與日誌

- **Cloudflare Analytics**: 查看流量和效能
- **Cloudflare Logs**: 查看請求日誌
- **Sentry**: 錯誤追蹤 (可選)

## 成本估算

### Cloudflare Pages
- 免費方案: 500 builds/月, 無限流量
- Pro 方案: $20/月

### Cloudflare Workers
- 免費方案: 100,000 requests/日
- Paid 方案: $5/月 起

### Cloudflare R2
- 免費方案: 10GB 儲存
- 超過: $0.015/GB/月

### 資料庫 (PlanetScale)
- 免費方案: 5GB 儲存
- Scaler 方案: $29/月

**預估總成本**: $0-10/月 (小型專案)

## 疑難排解

### 問題: CORS 錯誤

在後端設定 CORS:

```typescript
app.use(cors({
  origin: 'https://your-frontend.pages.dev',
  credentials: true
}));
```

### 問題: 資料庫連線失敗

檢查:
1. DATABASE_URL 格式是否正確
2. 資料庫防火牆是否允許 Cloudflare IP
3. SSL 設定是否正確

### 問題: 檔案上傳失敗

檢查:
1. S3 credentials 是否正確
2. Bucket 權限是否設定正確
3. CORS 設定是否允許上傳

## 聯絡支援

如有問題,請查閱:
- Cloudflare 文件: https://developers.cloudflare.com
- GitHub Issues: (您的 repository URL)
