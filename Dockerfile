FROM python:3.10-slim

WORKDIR /workspace/CosyVoice

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    sox \
    libsox-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host=mirrors.aliyun.com

# 複製源代碼
COPY . .

# 安裝額外的 web 服務依賴
RUN pip install fastapi uvicorn python-multipart

# 暴露端口
EXPOSE 50000 8080

# 創建啟動腳本
RUN echo '#!/bin/bash\n\
# 啟動 FastAPI 後端\n\
python runtime/python/fastapi/server.py --port 50000 --model_dir ${MODEL_DIR:-pretrained_models/CosyVoice2-0.5B} &\n\
\n\
# 啟動簡單的 HTTP 服務器提供前端文件\n\
cd web && python -m http.server 8080 &\n\
\n\
# 等待所有背景進程\n\
wait' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]