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
* **Data Sources (交通部中央氣象署)**:
  - `O-A0003-001`：自動氣象站即時觀測資料
  - `F-C0032-001`：一般天氣預報 - 今明 36 小時天氣預報
  - `W-C0033-001`：災害性天氣特報

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
| `GET` | `/api/health` | 系統健康狀況與快取統計 |
