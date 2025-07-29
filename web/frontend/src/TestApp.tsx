import React from 'react';

export default function TestApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#1e293b', marginBottom: '20px' }}>
        🎵 CosyVoice 語音合成系統
      </h1>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f1f5f9', 
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#334155', marginTop: '0' }}>系統狀態</h2>
        <p>✅ 前端 React 應用已載入</p>
        <p>✅ 後端服務正常運行</p>
        <p>✅ AI 模型已就緒</p>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ecfccb', 
        borderRadius: '6px',
        border: '1px solid #bef264'
      }}>
        <h3 style={{ color: '#365314', marginTop: '0' }}>使用說明</h3>
        <ol style={{ color: '#374151' }}>
          <li>選擇推理模式（3s極速複刻 或 跨語種複刻）</li>
          <li>上傳音頻文件作為語音範本</li>
          <li>輸入要合成的文字內容</li>
          <li>點擊生成音頻按鈕</li>
          <li>等待處理完成並播放結果</li>
        </ol>
        
        <button 
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
          onClick={() => alert('點擊成功！系統正常工作')}
        >
          測試按鈕
        </button>
      </div>
    </div>
  );
}