# Design.md

## Project Name
**Taiwan Weather Platform**
> 即時天氣 × 預報分析 × 地圖視覺化 × 警報通知

---

## Goal
建立一個可供一般使用者查詢的現代化氣象資訊平台，提供：
* 即時天氣（觀測站資訊、體感、溫濕度、風速雨量）
* 未來預報（36 小時縣市預報、一週鄉鎮天氣分析）
* 降雨資訊（即時雨量、熱區視覺化）
* 天氣警報（豪大雨、高低溫、颱風等 CWA 特報）
* 地圖視覺化（Leaflet 互動式測站地圖與降雨圖層）
* 收藏地區與個人化儀表板（User Dashboard）

---

## Tech Stack

### Frontend
* **Core & Build**: React 19, TypeScript, Vite
* **UI & Style**: MUI / Modern CSS Tokens, Lucide Icons
* **Data Fetching & State**: TanStack Query (React Query)
* **Visualization & Map**: Leaflet (React-Leaflet), Chart.js
* **Extra**: PWA, WebSocket

### Backend Options
* **Option A (推薦研究所 / 企業後端履歷)**: Spring Boot 3 + Java 21 + Spring Data JPA + MySQL + Redis
* **Option B (快速敏捷 / Python 生態系)**: Django REST Framework (DRF) / FastAPI + Python 3.11+ + MySQL + Redis

---

## System Architecture

```text
       CWA OpenData API (中央氣象署開放資料)
                       │
                       ▼
             [ Weather Sync Service ]
        (Scheduled Tasks: 10m / 30m / 6h)
                       │
                       ▼
             [ MySQL & Redis Cache ]
                       │
                       ▼
             [ RESTful API Server ]
            (Auth, Weather, Alert, GIS)
                       │
                       ▼
             [ React 19 Frontend ]
      (Apple Weather 風格 / 地圖 / 數據儀表板)
```

---

## CWA Data Sources (氣象署開放資料平台)

1. **O-A0003-001**：自動氣象站即時觀測資料（溫度、濕度、氣壓、風速、風向、降雨量，約 10 分鐘更新）
2. **F-D0047-091**：臺灣各縣市鄉鎮未來 1 週天氣預報（MinT, MaxT, PoP12h, Wx, CI）
3. **F-C0032-001**：一般天氣預報 - 今明 36 小時天氣預報（全台各縣市 PoP, MinT, MaxT, Wx）
4. **W-C0033-001**：災害性天氣特報（豪大雨、低溫、大風、濃霧等即時警特報）

---

## Database Schema Design (MySQL)

```sql
-- 1. 使用者資料表
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 收藏地區
CREATE TABLE favorite_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 氣象測站基本資料
CREATE TABLE weather_station (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    station_id VARCHAR(20) NOT NULL UNIQUE,
    station_name VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50),
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL
);

-- 4. 測站即時觀測資料
CREATE TABLE current_weather (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    station_id VARCHAR(20) NOT NULL,
    temperature DOUBLE,
    humidity DOUBLE,
    pressure DOUBLE,
    wind_speed DOUBLE,
    wind_direction DOUBLE,
    rain DOUBLE,
    update_time DATETIME NOT NULL,
    INDEX idx_station_time (station_id, update_time)
);

-- 5. 天氣預報資料
CREATE TABLE forecast (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(50) NOT NULL,
    forecast_type VARCHAR(20) DEFAULT '36H', -- '36H' or 'WEEKLY'
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    min_temp DOUBLE,
    max_temp DOUBLE,
    rain_probability INT,
    weather_desc VARCHAR(100),
    weather_icon VARCHAR(20),
    INDEX idx_location_time (location_name, start_time)
);

-- 6. 氣象特報
CREATE TABLE weather_alert (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_code VARCHAR(50),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20),
    start_time DATETIME,
    end_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Main Features & Pages

1. **首頁 (Home / Apple Weather 風格)**
   - 頂部城市切換與搜尋列
   - 即時溫度、體感溫度、天氣圖標、最高/最低溫
   - 資訊卡片九宮格：濕度、風速風向、紫外線指數、氣壓、能見度、日出日落
   - 24 小時逐時微預報條

2. **城市搜尋與預報 (Forecast)**
   - 支援全台縣市/行政區搜尋
   - 7 天預報折線與柱狀圖（Chart.js）：溫差變化、降雨機率 PoP
   - 舒適度指數 (CI) 與外出著裝/攜傘建議

3. **天氣地圖 (Weather & Rain Map)**
   - 整合 Leaflet + OpenStreetMap 臺灣圖層
   - 全台氣象測站標記（MarkerCluster），點擊彈出當前即時數據
   - 降雨熱度圖層（Rainfall Heatmap / Radar overlay）

4. **即時天氣特報 (Alerts Banner & Feed)**
   - 豪大雨、高溫特報即時跑馬燈與獨立警特報頁面
   - 警報層級徽章標示（黃色注意、橙色警戒、紅色危險）

5. **會員中心與個人化儀表板 (Dashboard)**
   - JWT 會員註冊 / 登入
   - 收藏常看縣市（快速切換與桌面 Widget 視圖）
   - 個人警特報訂閱與設定

---

## Bonus Features (面試亮點)
1. **PWA (Progressive Web App)**：支援離線快取、手機「加入主畫面」如原生 App
2. **WebSocket / SSE 警報即時推播**：突發豪雨或地震速報即刻推送
3. **AI 天氣速報 (LLM Summary)**：結合輕量 LLM 根據今日數值自動生成自然語言出門建議
4. **Redis 快取機制**：針對 CWA API 頻率限制進行快取（10m TTL），大幅提升 API 響應時間至 50ms 內

---

## 開發 Roadmap
* **Phase 1**: 基礎架構與 CWA API 模組串接、首頁即時天氣展示、城市搜尋
* **Phase 2**: 預報模組、Chart.js 趨勢分析圖表
* **Phase 3**: Leaflet 測站地圖、雨量視覺化
* **Phase 4**: 會員系統 (JWT)、收藏城市 Dashboard
* **Phase 5**: 警特報系統、Redis 快取優化、Docker 容器化部署
