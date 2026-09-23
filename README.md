# Taiwan Weather Platform (全台現代化氣象資訊平台)

> **即時天氣 × 預報分析 × 地圖視覺化 × 警報通知**
>
> 採用前後端分離現代化架構，直接串接交通部中央氣象署 (CWA) 開放資料平臺 API，擺脫傳統玩具 Demo，打造兼具現代美學與資料工程深度的 Web 專案。

---

## 🌟 專案特色

1. **Apple Weather 美學風格介面**：
   - 採用 Dark Glassmorphism（深色磨砂玻璃擬態）設計。
   - 支援即時體感溫度計算、紫外線指數 (UV) 分級、風速羅盤與舒適度 (CI) 建議。
2. **全台 22 縣市即時切換與快覽**：
   - 22 縣市一鍵快速切換，提供全島氣候即時卡片流與個人化收藏功能。
3. **Chart.js 專業預報分析**：
   - 今明 36 小時時段預報。
   - 溫度範圍走勢曲線圖（最高 / 最低溫變化）與降雨機率 (PoP %) 柱狀分析。
4. **Leaflet 互動測站地圖**：
   - 整合全台 360+ 個氣象署觀測站點（GeoJSON 格式輸出）。
   - 依即時氣溫自動著色（低溫藍色至高溫紅色），支援點擊彈出詳細觀測數據與雨量快篩。
5. **CWA 災害性特報即時跑馬燈**：
   - 即時追蹤發布中的豪大雨、陸上強風、低溫特報與影響縣市。
6. **高效快取保護機制**：
   - 後端內建 10 分鐘 TTL Cache，防止外部 CWA API 頻率限制超標，將 API 響應時間壓至 20ms 以內。

---

## 🛠 技術堆疊

* **Frontend**:
  - React 19 + TypeScript + Vite
  - Lucide React (現代視覺圖示)
  - Leaflet & React-Leaflet (全台測站 GIS 地理圖層)
  - Chart.js & React-Chartjs-2 (溫度曲線與降雨機率視覺化)
  - CSS Modules & Tokens (Dark Glassmorphism)
* **Backend**:
  - Python 3.9+ & FastAPI
  - Uvicorn (高效非同步 ASGI 伺服器)
  - HTTPX (非同步 HTTP 客戶端)
  - Pydantic v2 (資料結構檢驗與模型宣告)
  - SQLite (本機保存觀測、預報與警報歷史)
* **Data Sources (交通部中央氣象署)**:
  - `O-A0003-001`：自動氣象站即時觀測資料
  - `F-C0032-001`：一般天氣預報 - 今明 36 小時天氣預報
  - `W-C0033-001`：災害性天氣特報
* **Map Basemap (OpenStreetMap)**:
  - 使用無需 API key 的 OpenStreetMap 底圖並套用深色顯示；鄉鎮界線與中文地名由內政部國土測繪中心開放資料疊加。
  - 縣市名稱與目前溫度合併顯示；放大或點選標籤後，可檢視鄉鎮名稱及測站資訊。

---

## 🚀 快速啟動

### 方法一：一鍵啟動（推薦）
在專案根目錄下直接執行：
```bash
./start.sh
```

### 方法二：手動分別啟動

#### 1. 後端 (FastAPI)
```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```
* 後端服務位址：`http://localhost:8000`
* 互動式 Swagger API 文件：`http://localhost:8000/docs`

#### 2. 前端 (Vite + React)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
* 前端網頁介面：`http://localhost:5173`

## ☁️ Vercel 部署

GitHub Pages 自動部署已移除。此專案的前端與 FastAPI 後端是兩個 Vercel 專案，因為兩者使用不同執行環境：

1. 在 Vercel 匯入此 GitHub repository，建立前端專案，Root Directory 設為 `frontend`。使用 `npm run build` 建置，Output Directory 設為 `dist`。
2. 在 Vercel 再匯入同一個 repository，建立 API 專案，Root Directory 設為 `backend`。Vercel 會以 `index.py` 的 FastAPI `app` 作為入口；在專案環境變數設定 `CWA_API_KEY`。
3. 在前端 Vercel 專案設定 `VITE_API_BASE_URL` 為 API 專案的 origin，例如 `https://your-weather-api.vercel.app`，然後重新部署前端。

前端部署完成後會使用該 API 取得即時資料；本機開發則預設連到 `http://127.0.0.1:8000`。Vercel Functions 的 SQLite 檔案只能存於暫存目錄，不能作為持久歷史資料庫；若要在正式環境保留歷史資料，需改接持久化資料庫服務。

---

## 📡 RESTful API 規格

| 方法 | 端點 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/weather/current?city=臺北市` | 指定縣市當前代表站之即時氣象與體感數值 |
| `GET` | `/api/weather/overview` | 全台 22 縣市當前氣候總覽卡片清單 |
| `GET` | `/api/forecast/36h?city=臺北市` | 36 小時分時段預報數據（氣溫、降雨機率、舒適度） |
| `GET` | `/api/stations?format=geojson` | 全台 360+ 個自動觀測站地理點位與實測資料 |
| `GET` | `/api/alerts` | 即時災害性天氣特報清單 |
| `GET` | `/api/favorites` | 使用者收藏城市清單 |
| `POST` | `/api/favorites` | 新增收藏城市 |
| `DELETE` | `/api/favorites/{city}` | 移除收藏城市 |
| `GET` | `/api/history/weather-observations?station_id=466920&limit=100` | 查詢 SQLite 氣象站歷史觀測 |
| `GET` | `/api/health` | 系統健康狀況、快取與 SQLite 資料筆數 |

## 💾 SQLite 資料保存

後端第一次啟動時會自動建立 `backend/data/environment.db`，不需另外安裝資料庫。每次從 CWA 成功取得新資料時，會寫入對應的 `weather_observations`、`forecasts`、`weather_alerts` 資料表；同一測站與觀測時間會更新既有資料，避免快取過期後重複插入。資料庫檔案不會提交到 Git。

可設定 `DATABASE_PATH` 改變資料庫檔案位置。SQLite 歷史 API 文件可在 `http://localhost:8000/docs` 查閱。
