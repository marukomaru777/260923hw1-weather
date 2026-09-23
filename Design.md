# Taiwan Environmental Intelligence Platform

> 台灣環境資訊平台：天氣、空氣品質、降雨、警報與 GIS 視覺化

## 產品定位

協助使用者快速判斷所在地的天氣與環境風險。首頁以全台互動地圖為主，可切換氣溫、風速、雨量、濕度及空氣品質圖層；點選測站查看即時觀測、預報與環境摘要。縣市與鄉鎮逐層瀏覽、收藏地區及即時警報是主要使用流程。

## 使用者需求

- 今天會不會下雨、哪裡正在下大雨？
- 空氣品質與紫外線狀況如何？
- 颱風或其他天氣警報會不會影響所在地？
- 哪些縣市或鄉鎮環境風險較高？

## 系統架構

```text
CWA OpenData ── Weather / Rain / Forecast / Alerts ─┐
                                                    ├─ Data services + cache
MOENV OpenData ── AQI / PM2.5 / pollutant readings ┘
                       │
                 FastAPI REST API
                       │
             React + TypeScript + Leaflet
                       │
          GIS layers / district detail / favorites
```

目前實作使用 FastAPI、CWA OpenData、Leaflet、React 與 TypeScript。MOENV API 金鑰由後端環境變數管理；未設定或來源無法使用時，介面應明確呈現資料不可用，不得以虛構數值代替觀測。

## GIS 圖層

| 圖層 | 資料 | 地圖呈現 |
|---|---|---|
| 氣溫 | CWA 測站 | 溫度標籤與色階 |
| 風速 | CWA 測站 | 風速及風向 |
| 雨量 | CWA 雨量觀測 | 雨量標籤；後續加入雷達動畫 |
| 濕度 | CWA 測站 | 濕度標籤 |
| 空氣品質 | MOENV AQI 監測站 | AQI 標籤與健康風險色階 |

AQI 色階：0–50 綠、51–100 黃、101–150 橘、151–200 紅、201–300 紫、301 以上棕。點選站點查看 AQI、PM2.5、PM10、O3、CO、SO2、NO2 與更新時間。

## 首頁與互動流程

1. 全台地圖顯示主要測站與目前選取圖層數值。
2. 切換圖層觀察氣溫、風、雨量、濕度或空氣品質。
3. 選取縣市，再縮放查看鄉鎮或附近測站。
4. 開啟詳細面板查看溫度、體感、濕度、風速、降雨機率、AQI 與污染物。
5. 收藏常用地區，並在首頁快速切換。
6. 查看 CWA 警報與根據可用觀測資料產生的環境摘要。

## 風險與環境摘要

- 體感溫度：以溫度與濕度估算，並標示估算性質。
- 紫外線：呈現 CWA 觀測或預報值及風險級別。
- 舒適度：整合溫度、濕度與降雨資訊。
- 戶外風險摘要：根據即時資料產生規則式提示；資料不足時說明缺少項目。
- AI 摘要可在資料整合穩定後加入，必須能追溯其引用的觀測與更新時間。

## 資料模型規劃

### air_quality

```sql
CREATE TABLE air_quality (
    id BIGSERIAL PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL,
    county VARCHAR(50),
    aqi INTEGER,
    pm25 DOUBLE PRECISION,
    pm10 DOUBLE PRECISION,
    o3 DOUBLE PRECISION,
    co DOUBLE PRECISION,
    so2 DOUBLE PRECISION,
    no2 DOUBLE PRECISION,
    observed_at TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);
```

### environment_snapshot

整合地區、天氣、空氣品質、雨量、警報、資料來源與更新時間，供前端以單一請求讀取。資料量擴大後採 PostgreSQL + PostGIS，並以空間索引支援附近測站與行政區查詢。

## 技術方向

- 前端：React 19、TypeScript、Vite、Leaflet、Chart.js、Lucide。
- 後端：FastAPI、HTTPX、環境變數管理 API 金鑰、快取服務。
- 資料來源：中央氣象署 CWA OpenData、環境部 MOENV OpenData。
- 資料庫：現有階段使用 API 與快取；規劃 PostgreSQL + PostGIS 保存觀測歷史及空間資料。
- API：REST JSON；後續評估 GeoJSON、OGC API Features 與 SSE 警報推播。

## 開發路線

1. 完成現有地圖與氣象站資料體驗、縣市瀏覽、收藏及警報。
2. 串接環境部空氣品質 API，加入 AQI 圖層與測站詳情。
3. 加入行政區 drill-down、雨量熱區與雷達影像時間軸。
4. 整合天氣、空污、降雨與警報快照，改善快取與資料時間標示。
5. 建置 PostgreSQL/PostGIS、GeoJSON/OGC 查詢與推播。
6. 加入可追溯資料來源的環境摘要與 PWA 支援。
