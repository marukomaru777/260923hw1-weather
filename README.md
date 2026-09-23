# Taiwan Environment Platform

台灣即時天氣與地圖平台，整合中央氣象署（CWA）觀測、預報與特報資料，並以 Leaflet 顯示縣市、鄉鎮及測站資訊。

- 線上前端：[frontend-delta-three-29.vercel.app](https://frontend-delta-three-29.vercel.app/)
- 後端 API：[backend-seven-phi-49.vercel.app](https://backend-seven-phi-49.vercel.app/)
- API 健康檢查：[查看 `/api/health`](https://backend-seven-phi-49.vercel.app/api/health)

> 後端根網址 `/` 沒有首頁，回傳 `{"detail":"Not Found"}` 是預期行為。請使用下方列出的 `/api/...` 路由。

## 功能

- 縣市天氣總覽；縮放地圖或點選行政區後，可查看鄉鎮與測站資料。
- 氣溫、風速、雨量、濕度圖層切換，點選地區可開啟天氣詳細資料與 36 小時預報。
- 收藏縣市或鄉鎮，快速聚焦地圖；收藏資料存在瀏覽器 `localStorage`。
- 顯示即時天氣特報。
- 地圖使用 OpenStreetMap 底圖、專案內的鄉鎮界線 GeoJSON，不需要地圖 API key；底圖提供者與界線資料來源會在地圖上標示。
- 空氣品質/AQI 尚未納入目前版本。

## 技術

| 部分 | 技術 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite 8、Leaflet、Chart.js |
| 後端 | Python、FastAPI、Uvicorn、HTTPX |
| 本機資料庫 | SQLite，保存觀測、預報與特報歷史 |
| 線上部署 | Vercel 前端與後端分成兩個專案 |

## 資料來源

- CWA `O-A0003-001`：自動氣象站觀測。
- CWA `F-C0032-001`：36 小時天氣預報。
- CWA `W-C0033-001`：天氣特報。
- OpenStreetMap：地圖底圖。
- `frontend/public/taiwan-townships.geojson`：縣市與鄉鎮界線。

## 本機執行

需要 Python 3.9+、Node.js 20.19+（或 22.12+）及 npm。

### 一鍵啟動

在專案根目錄執行：

```bash
./start.sh
```

前端網址為 <http://127.0.0.1:5173>，後端 API 文件為 <http://127.0.0.1:8000/docs>。按 `Ctrl+C` 停止兩個服務。

### 分別啟動

先設定後端：

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env
```

編輯 `backend/.env`，把 `CWA_API_KEY` 設為在 [CWA 開放資料平台](https://opendata.cwa.gov.tw/)申請的授權碼。不要把 `.env` 提交至 Git。

```bash
./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

另開一個終端啟動前端：

```bash
cd frontend
npm install
npm run dev
```

開啟 <http://127.0.0.1:5173>。開發模式預設連線至 `http://127.0.0.1:8000`，通常不需設定前端環境變數。

若未設定有效的 CWA 金鑰或 API 無法連線，前端部分畫面會改顯示內建示範資料；請直接查詢後端 API 確認資料是否成功取得。

## Vercel 部署

GitHub Pages 工作流程已移除。前端與後端需在 Vercel 建立為兩個專案，並連接同一個 GitHub repository：

### Backend 專案

1. Root Directory 設為 `backend`。
2. 在 Project Settings → Environment Variables 新增 `CWA_API_KEY`，套用至 Production。
3. 入口檔為 `backend/index.py`，它匯入 FastAPI `app`；相依套件列於 `backend/requirements.txt`。
4. 儲存或變更環境變數後，重新部署 Production，讓新值套用到部署。

### Frontend 專案

1. Root Directory 設為 `frontend`。
2. Build Command 為 `npm run build`，Output Directory 為 `dist`。
3. 在 Project Settings → Environment Variables 設定 `VITE_API_BASE_URL` 為 Backend 專案的 origin，例如 `https://your-backend.vercel.app`，然後重新部署前端。

前端會呼叫 `${VITE_API_BASE_URL}/api/...`。不要把 `CWA_API_KEY` 設成 `VITE_` 開頭的前端變數，否則會暴露在瀏覽器端。

Vercel Serverless Function 的 `/tmp` 與程序記憶體都不是持久儲存：線上 SQLite 歷史資料、API 快取及後端收藏資料可能在重啟或不同執行個體間消失。正式環境若需要長期保存，請改用持久化資料庫。前端互動所用收藏存在各使用者自己的瀏覽器 `localStorage`。

## API

本機 API 根網址：`http://127.0.0.1:8000`。成功的資料端點通常回傳 JSON，資料欄位位於 `data`。

| 方法 | 路由 | 用途 |
| --- | --- | --- |
| `GET` | `/api/health` | 檢查 API 狀態、快取與 SQLite 資訊；不會驗證 CWA 是否成功回傳資料 |
| `GET` | `/api/weather/current?city=臺北市` | 指定縣市目前天氣與代表測站資料 |
| `GET` | `/api/weather/overview` | 全台縣市天氣總覽 |
| `GET` | `/api/forecast/36h?city=臺北市` | 指定縣市 36 小時預報；不帶 `city` 時查詢全部縣市 |
| `GET` | `/api/stations?county=臺北市` | 查詢測站，可用 `county` 篩選縣市 |
| `GET` | `/api/stations?county=臺北市&format=geojson` | 以 GeoJSON 回傳測站位置 |
| `GET` | `/api/alerts` | 天氣特報 |
| `GET` | `/api/favorites` | 後端收藏清單 API（目前前端改用 `localStorage`） |
| `POST` | `/api/favorites` | 新增後端收藏，JSON body：`{"city":"臺北市"}` |
| `DELETE` | `/api/favorites/{city}` | 移除後端收藏 |
| `GET` | `/api/history/weather-observations?station_id=466920&limit=100` | 查詢本機 SQLite 測站觀測歷史 |

確認後端是否真的取得 CWA 資料，可直接查詢：

```bash
curl "http://127.0.0.1:8000/api/weather/current?city=%E8%87%BA%E5%8C%97%E5%B8%82"
```

預期 HTTP 成功且回傳 `success: true` 與非空的 `data`。`/api/health` 的 `online` 只代表後端有啟動，不保證外部 CWA API 請求成功。線上環境將網址換成 Backend Vercel origin。

## SQLite

本機第一次啟動後端時會建立 `backend/data/environment.db`。成功取得資料後，觀測、預報與特報會寫入 SQLite；可用 `DATABASE_PATH` 指定其他位置，預設快取時間為 600 秒，可用 `CACHE_TTL_SECONDS` 調整。資料庫檔案已排除於 Git。
