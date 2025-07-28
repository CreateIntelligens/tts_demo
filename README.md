# CosyVoice 簡化版前後端分離

## 快速啟動

### 使用 Docker (推薦)

```bash
# 構建並啟動服務
docker-compose -f docker-compose.web.yml up --build

# 訪問界面
# 前端: http://localhost:8080
# 後端 API: http://localhost:50000
```

### 手動啟動

1. **啟動 FastAPI 後端**
```bash
cd runtime/python/fastapi
python server.py --port 50000 --model_dir ../../../pretrained_models/CosyVoice2-0.5B
```

2. **啟動前端服務器**
```bash
cd web
python server.py 8080
# 或者使用內建服務器
python -m http.server 8080
```

## 功能特色

### ✨ 簡化界面
- 清爽的現代化設計
- 響應式布局，支援手機和桌面
- 直覺的操作流程

### 🎯 三種模式
1. **預訓練音色**: 選擇內建音色直接合成
2. **3秒極速複刻**: 上傳音頻樣本快速複製音色
3. **自然語言控制**: 用文字描述想要的語音風格

### 🔧 技術優勢
- 前後端分離架構
- FastAPI 高性能後端
- 純 HTML/CSS/JS 前端，易於修改
- Docker 一鍵部署

## 文件結構

```
web/
├── index.html          # 主界面
├── static/
│   ├── css/style.css   # 樣式文件
│   └── js/app.js       # 前端邏輯
└── server.py           # 前端文件服務器

docker-compose.web.yml  # Docker 編排文件
Dockerfile.web          # Docker 映像檔
```

## API 端點

- `POST /inference_sft` - 預訓練音色合成
- `POST /inference_zero_shot` - 零樣本音色複製
- `POST /inference_instruct` - 指令控制合成

## 備份文件

原始文件已備份為 `.backup` 後綴:
- `docker-compose.yml.backup`
- `runtime/python/Dockerfile.backup`
- `webui.py.backup`

## 自定義修改

1. **樣式修改**: 編輯 `web/static/css/style.css`
2. **功能擴展**: 修改 `web/static/js/app.js`
3. **界面調整**: 編輯 `web/index.html`

## 故障排除

1. **CORS 錯誤**: 確保前後端在相同域名或正確配置 CORS
2. **模型載入失敗**: 檢查模型路徑和權限
3. **音頻無法播放**: 確認瀏覽器支援音頻格式

---

💡 **提示**: 這個簡化版本便於在 Replit 等平台上快速部署和修改