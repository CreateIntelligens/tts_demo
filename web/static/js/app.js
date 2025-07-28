class CosyVoiceApp {
    constructor() {
        this.currentMode = 'sft';
        this.apiBase = 'http://localhost:50000';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSpeakers();
        this.updateUI();
    }

    bindEvents() {
        // 模式切換
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
                this.updateUI();
            });
        });

        // 生成按鈕
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateAudio();
        });

        // 文件上傳處理
        document.getElementById('audio-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.updateStatus(`已選擇音頻文件: ${file.name}`);
            }
        });
    }

    updateUI() {
        // 隱藏所有特定模式的區塊
        document.getElementById('sft-section').classList.add('hidden');
        document.getElementById('zero-shot-section').classList.add('hidden');
        document.getElementById('instruct-section').classList.add('hidden');

        // 顯示當前模式的區塊
        switch(this.currentMode) {
            case 'sft':
                document.getElementById('sft-section').classList.remove('hidden');
                break;
            case 'zero_shot':
                document.getElementById('zero-shot-section').classList.remove('hidden');
                break;
            case 'instruct':
                document.getElementById('instruct-section').classList.remove('hidden');
                break;
        }
    }

    async loadSpeakers() {
        try {
            // 這裡需要一個 API 來獲取可用的音色列表
            // 暫時使用模擬數據
            const speakers = [
                '中文女性',
                '中文男性',
                '英文女性',
                '英文男性',
                '日文女性'
            ];

            const sftSelect = document.getElementById('speaker-select');
            const instructSelect = document.getElementById('instruct-speaker-select');
            
            sftSelect.innerHTML = '';
            instructSelect.innerHTML = '';

            speakers.forEach(speaker => {
                const option = new Option(speaker, speaker);
                sftSelect.add(option.cloneNode(true));
                instructSelect.add(option);
            });

        } catch (error) {
            console.error('載入音色失敗:', error);
            this.updateStatus('載入音色失敗', 'error');
        }
    }

    async generateAudio() {
        const text = document.getElementById('tts-text').value.trim();
        if (!text) {
            alert('請輸入要合成的文字');
            return;
        }

        const generateBtn = document.getElementById('generate-btn');
        generateBtn.disabled = true;
        this.updateStatus('正在生成語音...', 'loading');

        try {
            let audioBlob;
            switch(this.currentMode) {
                case 'sft':
                    audioBlob = await this.generateSFT(text);
                    break;
                case 'zero_shot':
                    audioBlob = await this.generateZeroShot(text);
                    break;
                case 'instruct':
                    audioBlob = await this.generateInstruct(text);
                    break;
            }

            if (audioBlob) {
                this.playAudio(audioBlob);
                this.updateStatus('語音生成完成', 'success');
            }

        } catch (error) {
            console.error('生成失敗:', error);
            this.updateStatus('生成失敗: ' + error.message, 'error');
        } finally {
            generateBtn.disabled = false;
        }
    }

    async generateSFT(text) {
        const speaker = document.getElementById('speaker-select').value;
        if (!speaker) {
            throw new Error('請選擇音色');
        }

        const formData = new FormData();
        formData.append('tts_text', text);
        formData.append('spk_id', speaker);

        const response = await fetch(`${this.apiBase}/inference_sft`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.blob();
    }

    async generateZeroShot(text) {
        const promptText = document.getElementById('prompt-text').value.trim();
        const audioFile = document.getElementById('audio-upload').files[0];

        if (!promptText) {
            throw new Error('請輸入參考文字');
        }
        if (!audioFile) {
            throw new Error('請上傳參考音頻');
        }

        const formData = new FormData();
        formData.append('tts_text', text);
        formData.append('prompt_text', promptText);
        formData.append('prompt_wav', audioFile);

        const response = await fetch(`${this.apiBase}/inference_zero_shot`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.blob();
    }

    async generateInstruct(text) {
        const speaker = document.getElementById('instruct-speaker-select').value;
        const instructText = document.getElementById('instruct-text').value.trim();

        if (!speaker) {
            throw new Error('請選擇音色');
        }
        if (!instructText) {
            throw new Error('請輸入語音指令');
        }

        const formData = new FormData();
        formData.append('tts_text', text);
        formData.append('spk_id', speaker);
        formData.append('instruct_text', instructText);

        const response = await fetch(`${this.apiBase}/inference_instruct`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.blob();
    }

    playAudio(audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = document.getElementById('result-audio');
        const placeholder = document.getElementById('audio-placeholder');

        audioElement.src = audioUrl;
        audioElement.style.display = 'block';
        placeholder.style.display = 'none';

        // 清理之前的 URL
        audioElement.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
        }, { once: true });
    }

    updateStatus(message, type = '') {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = 'status ' + type;
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new CosyVoiceApp();
});