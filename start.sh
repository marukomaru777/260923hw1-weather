#!/bin/bash
# Taiwan Weather Platform 一鍵啟動腳本

echo "=========================================="
echo "  Taiwan Weather Platform 一鍵啟動腳本"
echo "=========================================="

# 取得腳本所在目錄
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$BASE_DIR"

# 1. 啟動後端 FastAPI (Port 8000)
echo "🚀 [1/2] 啟動後端服務 (FastAPI on Port 8000)..."
cd "$BASE_DIR/backend"
if [ ! -d "venv" ]; then
    echo "⚠️ 建立 Python 虛擬環境..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "✅ 後端已啟動 (PID: $BACKEND_PID) -> http://127.0.0.1:8000/docs"

# 2. 啟動前端 Vite (Port 5173)
echo "🌐 [2/2] 啟動前端介面 (React 19 + Vite on Port 5173)..."
cd "$BASE_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "⚠️ 安裝前端依賴套件..."
    npm install
fi
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo "✅ 前端已啟動 (PID: $FRONTEND_PID) -> http://127.0.0.1:5173"

echo "=========================================="
echo "🎉 平台已全部就緒！"
echo "👉 請在瀏覽器開啟：http://127.0.0.1:5173"
echo "👉 後端 API Swagger 文件：http://127.0.0.1:8000/docs"
echo "按 Ctrl+C 可停止所有服務..."
echo "=========================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
