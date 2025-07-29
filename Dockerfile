FROM python:3.10-slim

WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    sox \
    libsox-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy and install Python requirements (這樣就不用每次啟動都裝)
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy package files and install Node dependencies (這樣就不用每次啟動都裝)
COPY package.json package-lock.json* ./
RUN npm install
RUN npm install multer

# Create directories
RUN mkdir -p /workspace/data/audio
RUN mkdir -p /workspace/data/models

# Set environment
ENV PYTHONPATH=/workspace
ENV NODE_ENV=development
ENV PORT=8878

# Expose port
EXPOSE 8878

CMD ["npm", "run", "dev"]