const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const os = require('os');

const PORT = 8443;
const HTTP_PORT = 8080;
const DIR = __dirname;

const certPath = path.join(DIR, 'server.crt');
const keyPath = path.join(DIR, 'server.key');

function getIPs() {
  const ips = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

function generateCert() {
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('🔐 Generating self-signed certificate...');
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost" 2>/dev/null`);
    console.log('✅ Certificate generated.');
  }
}

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.wav': 'audio/wav',
  '.mp4': 'video/mp4', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.wasm': 'application/wasm'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function requestHandler(req, res) {
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  if (!filePath.startsWith(DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    serveFile(res, filePath);
  });
}

generateCert();

const httpsOptions = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
const server = https.createServer(httpsOptions, requestHandler);

server.listen(PORT, '0.0.0.0', () => {
  const ips = getIPs();
  console.log('\n✅ HTTPS Server running!');
  console.log('\n📱 Buka di HP:');
  ips.forEach(ip => console.log(`   https://${ip}:${PORT}`));
  console.log(`\n💻 Local: https://localhost:${PORT}`);
  console.log('\n⚠️  Browser akan warning "Not Secure" → klik Advanced → Proceed/Accept\n');
});
