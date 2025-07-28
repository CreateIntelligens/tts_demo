#!/usr/bin/env python3
"""
簡單的靜態文件服務器，用於提供前端界面
也可以使用 python -m http.server 8080 替代
"""
import http.server
import socketserver
import os
import sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def end_headers(self):
        # 添加 CORS 頭部允許跨域請求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"前端界面運行在 http://localhost:{PORT}")
        print("按 Ctrl+C 停止服務器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服務器已停止")
            httpd.shutdown()