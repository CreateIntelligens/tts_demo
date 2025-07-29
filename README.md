# CosyVoice 推理專用版本

## 🎯 特色

- **📁 完全掛載**: 所有代碼和模型都使用 Docker 掛載，無需重新構建
- **🚀 快速啟動**: 容器只包含運行環境，代碼修改即時生效
- **💡 推理專用**: 專為語音合成推理優化，移除不必要的組件
- **🎨 現代界面**: React + TypeScript 前端，響應式設計

## 📁 目錄結構

```
CosyVoice/
├── client/                 # React 前端（掛載）
├── server/                 # Node.js 後端（掛載）
├── shared/                 # 共享代碼（掛載）
├── cosyvoice/              # CosyVoice 核心（掛載）
├── pretrained_models/      # 預訓練模型（掛載，只讀）
├── temp/                   # 音頻輸出（掛載）
├── docker-compose.yml      # 推理專用配置
├── Dockerfile              # 輕量化運行環境
└── start.sh                # 容器啟動腳本
```

## 🚀 快速啟動

### 1. 確保模型存在
```bash
# 確保有預訓練模型
ls pretrained_models/CosyVoice2-0.5B/
```

### 2. 啟動服務
```bash
# 構建並啟動（首次）
docker-compose up --build

# 後續直接啟動
docker-compose up

# 後台運行
docker-compose up -d
```

### 3. 訪問界面
```bash
open http://localhost:8878
```

## ⚡ 優勢

### 🔄 即時修改
- **前端代碼**: 修改 `client/` 下的文件，重新構建即生效
- **後端代碼**: 修改 `server/` 下的文件，重啟容器即生效
- **Python 服務**: 修改 `server/services/cosyvoice.py`，重啟即生效

### 💾 數據持久化
- **音頻文件**: 生成的音頻保存在 `temp/audio/`
- **模型文件**: 使用本地 `pretrained_models/` 目錄
- **配置文件**: 所有配置都在主機上，容器重建不丟失

### 🎛️ 環境變數配置
```yaml
environment:
  - PORT=8878                     # 服務端口
  - MODEL_BASE_DIR=/workspace/pretrained_models
  - TTS_MAX_TEXT_LENGTH=500       # 文字長度限制
  - TORCH_THREADS=4               # PyTorch 線程數
```

## 🛠️ 開發模式

### 本地開發
```bash
# 直接在主機運行（開發用）
./start.sh

# 或者
npm run dev
```

### 容器開發
```bash
# 進入容器調試
docker-compose exec cosyvoice-inference bash

# 查看日誌
docker-compose logs -f
```

## 📚 API 端點

所有 API 運行在 `http://localhost:8878`:

- `GET /health` - 健康檢查
- `POST /api/tts/synthesize` - TTS 合成
- `GET /api/audio` - 音頻列表
- `GET /api/audio/:id/stream` - 音頻播放
- `GET /api/audio/:id/download` - 音頻下載

## 🔧 配置調整

### 修改端口
```yaml
# docker-compose.yml
ports:
  - "9999:8878"  # 外部端口:內部端口
```

### 調整資源限制
```yaml
deploy:
  resources:
    limits:
      memory: 16G  # 增加記憶體限制
    reservations:
      memory: 8G   # 預留記憶體
```

### GPU 配置
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1  # 使用的 GPU 數量
          capabilities: [gpu]
```

## 🐛 故障排除

### 常見問題

1. **模型載入失敗**
   ```bash
   # 檢查模型目錄
   ls -la pretrained_models/CosyVoice2-0.5B/
   ```

2. **端口被占用**
   ```bash
   # 檢查端口占用
   netstat -tlnp | grep 8878
   
   # 修改 docker-compose.yml 中的端口
   ports:
     - "8879:8878"
   ```

3. **權限問題**
   ```bash
   # 確保目錄權限
   chmod -R 755 temp/
   chmod +x start.sh
   ```

4. **依賴安裝失敗**
   ```bash
   # 清理並重建
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

### 日誌查看
```bash
# 實時日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs cosyvoice-inference

# 進入容器檢查
docker-compose exec cosyvoice-inference bash
```

## 📝 與複雜版本對比

| 項目 | 推理專用版 | 完整構建版 |
|------|-----------|-----------|
| 構建時間 | ~2分鐘 | ~10分鐘 |
| 鏡像大小 | ~1GB | ~3GB |
| 代碼修改 | 即時生效 | 需重新構建 |
| 資源占用 | 低 | 高 |
| 部署複雜度 | 簡單 | 複雜 |

## 🎉 開始使用

```bash
# 1. 克隆或更新代碼
git pull

# 2. 確保模型存在
ls pretrained_models/

# 3. 啟動服務
docker-compose up --build

# 4. 開始合成語音
open http://localhost:8878
```

---

🎙️ **享受高效的 CosyVoice 推理體驗！**