# Frontend

Taiwan Environment Platform 的 React、TypeScript 與 Vite 前端。功能、資料來源、本機啟動方式、API 路由及 Vercel 設定請見專案根目錄的 [README](../README.md)。

## 開發

```bash
npm install
npm run dev
```

Vite 開發模式預設連線到 `http://127.0.0.1:8000` 的 FastAPI 後端。生產環境以 `VITE_API_BASE_URL` 指定後端 origin；此變數只應存放公開的 API 網址，不可放 API key。

## 指令

- `npm run dev`：啟動 Vite 開發伺服器。
- `npm run build`：執行 TypeScript 專案檢查並建立生產版 `dist/`。
- `npm run preview`：預覽已建立的生產版。
- `npm run lint`：執行 Oxlint。
