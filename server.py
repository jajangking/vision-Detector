import http.server
import ssl
import os
import subprocess
import socket

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 1))
        return s.getsockname()[0]
    except:
        return '127.0.0.1'
    finally:
        s.close()

cert, key = 'server.crt', 'server.key'
if not os.path.exists(cert) or not os.path.exists(key):
    print("🔐 Generating self-signed certificate...")
    subprocess.run(['openssl', 'req', '-new', '-x509', '-keyout', key, '-out', cert, '-days', '365', '-nodes', '-subj', '/CN=localhost'], check=True)

ip = get_ip()
port = 8443
print(f"\n✅ Server siap: https://{ip}:{port}")
print("⚠️  Browser akan warning 'Not Secure'. Klik Advanced → Proceed/Accept.\n")

httpd = http.server.HTTPServer(('0.0.0.0', port), http.server.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, keyfile=key, certfile=cert, server_side=True)

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n👋 Server stopped.")
