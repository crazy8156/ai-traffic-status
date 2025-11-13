# 財務報表分析平台 - 部署指引

## 專案概述

本專案是一個整合 Excel 檔案管理、資料視覺化與 ChatGPT AI 分析的企業財務報表平台。包含前台報表展示、即時對話功能,以及後台檔案管理與 AI 狀態監控。

## 技術架構

- **前端**: React 19 + Tailwind CSS 4 + Recharts
- **後端**: Express 4 + tRPC 11
- **資料庫**: MySQL/TiDB
- **檔案儲存**: S3 相容儲存
- **AI 整合**: OpenAI ChatGPT API
- **認證**: Manus OAuth

## 環境變數

### 系統自動注入變數 (無需手動設定)

以下環境變數由 Manus 平台自動管理:

- `DATABASE_URL` - 資料庫連線字串
- `JWT_SECRET` - Session 簽章金鑰
- `VITE_APP_ID` - OAuth 應用程式 ID
- `OAUTH_SERVER_URL` - OAuth 後端 URL
- `VITE_OAUTH_PORTAL_URL` - OAuth 登入入口 URL
- `OWNER_OPEN_ID`, `OWNER_NAME` - 擁有者資訊
- `VITE_APP_TITLE` - 應用程式標題
- `VITE_APP_LOGO` - 應用程式 Logo
- `BUILT_IN_FORGE_API_URL` - Manus 內建 API URL
- `BUILT_IN_FORGE_API_KEY` - Manus 內建 API 金鑰
- `VITE_FRONTEND_FORGE_API_KEY` - 前端 API 金鑰
- `VITE_FRONTEND_FORGE_API_URL` - 前端 API URL

### 使用者需設定變數

- `OPENAI_API_KEY` - OpenAI API 金鑰 (必要,用於 ChatGPT 功能)

## 部署前檢查清單

### 1. 資料庫遷移

確保資料庫 Schema 已正確推送:

```bash
pnpm db:push
```

### 2. 環境變數確認

在 Manus 管理介面的 Settings → Secrets 中確認:
- ✅ `OPENAI_API_KEY` 已設定

### 3. 功能測試

- ✅ 使用者登入/登出
- ✅ Excel 檔案上傳 (支援 .xlsx, .xls, .csv)
- ✅ 檔案列表顯示與刪除
- ✅ 報表視覺化 (圓餅圖、長條圖、折線圖)
- ✅ ChatGPT 對話功能
- ✅ AI 狀態監控面板
- ✅ Token 用量追蹤
- ✅ 錯誤日誌記錄

### 4. 效能優化

- ✅ 檔案上傳進度條
- ✅ 檔案大小限制 (10MB)
- ✅ 檔案類型驗證
- ✅ 響應式設計 (支援手機/平板/桌面)

## 部署步驟

### 使用 Manus 平台部署

1. **建立檢查點**
   - 在開發完成後,點擊「Save Checkpoint」建立版本快照
   - 填寫版本描述,例如:「v1.0 - 完整功能上線版本」

2. **發布網站**
   - 點擊管理介面右上角的「Publish」按鈕
   - 系統會自動部署最新檢查點到生產環境
   - 部署完成後會獲得公開網址 (預設為 `*.manus.space`)

3. **自訂網域 (選用)**
   - 前往 Settings → Domains
   - 修改子網域前綴或綁定自訂網域
   - 依照指示設定 DNS 記錄

### Cloudflare 部署相容性

本專案已針對 Cloudflare 部署進行優化:

- ✅ 靜態資源使用 CDN 快取
- ✅ API 路由正確配置 (`/api/*`)
- ✅ WebSocket 支援 (若需要)
- ✅ 環境變數透過平台管理

## 部署後驗證

### 1. 功能驗證

訪問部署後的網址,測試以下功能:

1. 首頁載入正常
2. 登入流程順暢
3. 上傳 Excel 檔案成功
4. 報表視覺化正確顯示
5. ChatGPT 對話功能正常
6. AI 狀態面板數據正確

### 2. 效能監控

在 Management Dashboard 中查看:

- UV/PV 訪問統計
- API 回應時間
- 錯誤率監控

### 3. 資料庫連線

確認資料庫連線正常:

- 前往 Database 面板
- 檢查資料表結構
- 驗證資料讀寫功能

## 常見問題

### Q: ChatGPT 功能無法使用?

**A:** 檢查 `OPENAI_API_KEY` 是否正確設定:
1. 前往 Settings → Secrets
2. 確認 `OPENAI_API_KEY` 存在且有效
3. 測試 API 金鑰是否有足夠額度

### Q: 檔案上傳失敗?

**A:** 可能原因:
1. 檔案大小超過 10MB 限制
2. 檔案格式不支援 (僅支援 .xlsx, .xls, .csv)
3. S3 儲存空間不足

### Q: 資料庫連線錯誤?

**A:** 確認:
1. `DATABASE_URL` 環境變數正確
2. 資料庫服務正常運作
3. 執行 `pnpm db:push` 確保 Schema 同步

### Q: 如何更新 Logo?

**A:** 
1. 修改 `client/src/const.ts` 中的 `APP_LOGO` 常數
2. 在管理介面 Settings → General 中更新 Favicon (如需同步)

## 維護建議

### 定期備份

- 定期建立檢查點保存程式碼版本
- 使用 Database 面板匯出重要資料

### 監控 AI 用量

- 定期檢查 AI 狀態面板
- 監控 Token 用量避免超出預算
- 查看錯誤日誌及時發現問題

### 安全性

- 定期更換 API 金鑰
- 檢查使用者權限設定
- 監控異常登入行為

## 技術支援

如遇到部署或使用問題,請訪問:
- Manus 官方文件: https://docs.manus.im
- 技術支援: https://help.manus.im

## 版本歷程

- **v1.0** (2025-01-13)
  - ✅ 完整前後台功能
  - ✅ Excel 檔案管理
  - ✅ 資料視覺化 (圓餅圖、長條圖、折線圖)
  - ✅ ChatGPT AI 智能分析
  - ✅ AI 狀態監控面板
  - ✅ 檔案上傳進度條
  - ✅ Token 用量追蹤
