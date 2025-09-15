#!/usr/bin/env python3
"""
Simple HTTP Server for Soulix Website
Allows external access to the website for testing and sharing
"""

import http.server
import socketserver
import mimetypes
import os
import sys
import socket
import webbrowser
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve files with proper MIME types"""
    
    def end_headers(self):
        # Add CORS headers for external access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """Override to handle additional file types"""
        # Python 3.11 SimpleHTTPRequestHandler.guess_type returns a string.
        # Use mimetypes.guess_type to retrieve (type, encoding) and return only the MIME type.
        ctype, _ = mimetypes.guess_type(path)

        # Explicit overrides for commonly mis-detected types
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.json'):
            return 'application/json'
        if path.endswith('.woff2'):
            return 'font/woff2'
        if path.endswith('.woff'):
            return 'font/woff'
        if path.endswith('.ttf'):
            return 'font/ttf'

        return ctype or 'application/octet-stream'

class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    # Allow quick restart and concurrent requests
    allow_reuse_address = True

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"

def start_server(port=8000, open_browser=True, max_retries=10):
    """Start the HTTP server"""
    
    # Change to the website directory
    website_dir = Path(__file__).parent
    os.chdir(website_dir)
    
    # Get local IP
    local_ip = get_local_ip()
    
    try:
        # Create server; if port is busy and not zero, try subsequent ports
        attempts = 0
        httpd = None
        last_err = None
        while httpd is None:
            try:
                httpd = ThreadingTCPServer(("", port), CustomHTTPRequestHandler)
            except OSError as e:
                last_err = e
                errno_val = getattr(e, 'errno', None)
                if port != 0 and errno_val in (48, 98, 10048) and attempts < max_retries:
                    attempts += 1
                    port += 1
                    continue
                else:
                    raise

        with httpd as httpd:
            print("=" * 60)
            print("🚀 SOULIX WEBSITE SERVER STARTED")
            print("=" * 60)
            print(f"📁 Serving directory: {website_dir}")
            print(f"🌐 Port: {httpd.server_address[1]}")
            print()
            print("📱 ACCESS URLS:")
            print(f"   Local:    http://localhost:{httpd.server_address[1]}")
            print(f"   Network:  http://{local_ip}:{httpd.server_address[1]}")
            print()
            print("🔗 EXTERNAL ACCESS:")
            print(f"   Share this URL with others on your network:")
            print(f"   http://{local_ip}:{httpd.server_address[1]}")
            print()
            print("📋 MOBILE ACCESS:")
            print(f"   On mobile devices connected to same WiFi:")
            print(f"   http://{local_ip}:{httpd.server_address[1]}")
            print()
            print("⚡ FEATURES:")
            print("   • CORS enabled for API calls")
            print("   • Proper MIME types for all assets")
            print("   • External network access")
            print("   • Mobile device compatibility")
            print()
            print("� FIREWALL (Windows): If mobile/others can't access, allow Python through firewall or run:")
            print("   netsh advfirewall firewall add rule name=\"Soulix Server\" dir=in action=allow protocol=TCP localport=" + str(httpd.server_address[1]))
            print()
            print("�🛑 Press Ctrl+C to stop the server")
            print("=" * 60)
            
            # Open browser automatically
            if open_browser:
                try:
                    webbrowser.open(f'http://localhost:{port}')
                except:
                    pass
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        errno_val = getattr(e, 'errno', None)
        if errno_val in (48, 98, 10048):  # Port already in use across platforms
            print("❌ Port is already in use.")
            print("   Try a different port, e.g.: python server.py --port 0  (auto-pick) or another number")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Start Soulix Website Server")
    parser.add_argument("--port", "-p", type=int, default=8000, 
                       help="Port to run server on (default: 8000)")
    parser.add_argument("--no-browser", action="store_true",
                       help="Don't open browser automatically")
    
    args = parser.parse_args()
    
    start_server(port=args.port, open_browser=not args.no_browser)