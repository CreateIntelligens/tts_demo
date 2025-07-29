import React, { useState } from 'react';

export default function SimpleApp() {
  const [text, setText] = useState('我是通義實驗室語音團隊全新推出的生成式語音大模型，提供舒適自然的語音合成能力。');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 基於原始 webui.py 的模式
  const [inferenceMode, setInferenceMode] = useState<'3s極速複刻' | '跨語種複刻'>('3s極速複刻');
  const [sftSpeaker, setSftSpeaker] = useState('中性');
  const [promptText, setPromptText] = useState('');
  const [promptAudioFile, setPromptAudioFile] = useState<File | null>(null);
  const [promptAudioRecord, setPromptAudioRecord] = useState<File | null>(null);
  const [instructText, setInstructText] = useState('');
  const [seed, setSeed] = useState(54509709);
  const [speed, setSpeed] = useState(1.0);
  const [streamMode, setStreamMode] = useState(false);
  const [modelPath, setModelPath] = useState('/workspace/data/models/pretrained_models/CosyVoice2-0.5B');

  // 指令字典，基於原始 webui.py
  const instructDict = {
    '3s極速複刻': '1. 選擇prompt音頻文件，或錄入prompt音頻，注意不超過30s，若同時提供，優先選擇prompt音頻文件\n2. 輸入prompt文本\n3. 點擊生成音頻按鈕',
    '跨語種複刻': '1. 選擇prompt音頻文件，或錄入prompt音頻，注意不超過30s，若同時提供，優先選擇prompt音頻文件\n2. 點擊生成音頻按鈕'
  };
  
  const availableSpeakers = ['中性', '中文女', '中文男', '英文女', '英文男', '日文女', '韓文女'];

  const generateSeed = () => {
    setSeed(Math.floor(Math.random() * 100000000));
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('請輸入要合成的文字內容');
      return;
    }
    
    // 驗證不同模式的必要參數
    if (inferenceMode === '3s極速複刻' && !promptText.trim()) {
      setError('3s極速複刻模式需要輸入prompt文本');
      return;
    }
    
    if (!promptAudioFile && !promptAudioRecord) {
      setError('請選擇或錄製prompt音頻文件');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 轉換模式名稱到 API 格式
      const modeMap = {
        '3s極速複刻': 'zero_shot',
        '跨語種複刻': 'cross_lingual'
      };

      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('mode', modeMap[inferenceMode]);
      formData.append('modelPath', modelPath);
      formData.append('outputFormat', 'wav');
      formData.append('speed', speed.toString());
      formData.append('stream', streamMode.toString());
      formData.append('seed', seed.toString());
      
      if (inferenceMode === '3s極速複刻') {
        formData.append('promptText', promptText);
      }
      
      // 優先使用上傳的文件，如果沒有則使用錄製的
      const audioFile = promptAudioFile || promptAudioRecord;
      if (audioFile) {
        formData.append('promptAudio', audioFile);
      }

      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success && result.audioFile) {
        const audioUrl = `/api/audio/${result.audioFile.id}/stream`;
        setCurrentAudioUrl(audioUrl);
        setError(null);
      } else {
        setError(result.error || '語音合成失敗');
      }
    } catch (error) {
      console.error('合成錯誤:', error);
      setError('網路錯誤或服務不可用');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 輸入合成文本 */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '500', 
            marginBottom: '12px',
            color: '#333' 
          }}>
            輸入合成文本
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            placeholder="請輸入要合成的文字內容..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          
          {/* 選擇推理模式 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333' 
            }}>
              選擇推理模式
            </div>
            {(['3s極速複刻', '跨語種複刻'] as const).map((mode) => (
              <label key={mode} style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                <input 
                  type="radio" 
                  name="inferenceMode" 
                  checked={inferenceMode === mode}
                  onChange={() => setInferenceMode(mode)}
                  style={{ marginRight: '6px' }}
                />
                {mode}
              </label>
            ))}
          </div>

          {/* 操作步驟 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333' 
            }}>
              操作步驟
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              whiteSpace: 'pre-line',
              lineHeight: '1.4'
            }}>
              {instructDict[inferenceMode]}
            </div>
          </div>

          {/* 模型路徑選擇 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333' 
            }}>
              選擇模型路徑
            </div>
            <input
              type="text"
              value={modelPath}
              onChange={(e) => setModelPath(e.target.value)}
              placeholder="輸入模型路徑或選擇預設模型"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            />
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={() => setModelPath('/workspace/data/models/pretrained_models/CosyVoice2-0.5B')}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                預設模型
              </button>
            </div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          
          {/* Prompt 文本輸入 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px',
              color: '#333' 
            }}>
              輸入prompt文本
            </div>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={!(inferenceMode === '3s極速複刻')}
              placeholder="請輸入prompt文本，需與prompt音頻內容一致，暫時不支持自動識別..."
              style={{
                width: '100%',
                height: '100px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
                resize: 'vertical',
                backgroundColor: (inferenceMode === '3s極速複刻') ? 'white' : '#f5f5f5'
              }}
            />
          </div>

          {/* Prompt 音頻 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '8px',
                color: '#333' 
              }}>
                選擇prompt音頻文件，注意採樣率不低於16khz
              </div>
              <input 
                type="file" 
                accept="audio/*"
                onChange={(e) => setPromptAudioFile(e.target.files?.[0] || null)}
                disabled={!(inferenceMode === '3s極速複刻' || inferenceMode === '跨語種複刻')}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: (inferenceMode === '3s極速複刻' || inferenceMode === '跨語種複刻') ? 'white' : '#f5f5f5'
                }}
              />
            </div>
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '8px',
                color: '#333' 
              }}>
                錄制prompt音頻文件
              </div>
              <div style={{ 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: '#f9f9f9',
                textAlign: 'center',
                color: '#666',
                fontSize: '13px'
              }}>
                <span style={{ color: '#ff6b35', marginRight: '8px' }}>●</span>
                Record
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  No microphone found
                </div>
              </div>
            </div>
          </div>

        </div>


        {/* 生成音頻按鈕 */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={handleSynthesize}
            disabled={isLoading || !text.trim()}
            style={{
              backgroundColor: isLoading ? '#ccc' : '#ff6b35',
              color: 'white',
              border: 'none',
              padding: '12px 48px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {isLoading ? '生成中...' : '生成音頻'}
          </button>
        </div>

        {/* 錯誤顯示 */}
        {error && (
          <div style={{ 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#d4380d'
          }}>
            {error}
          </div>
        )}

        {/* 音頻播放器 */}
        {currentAudioUrl && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333' 
            }}>
              合成音頻
            </div>
            <audio 
              controls 
              src={currentAudioUrl}
              style={{ width: '100%' }}
              autoPlay
            >
              您的瀏覽器不支援音頻播放
            </audio>
          </div>
        )}

      </div>
    </div>
  );
}