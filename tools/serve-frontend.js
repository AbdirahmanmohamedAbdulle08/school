const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'Frontend', 'dist');
const port = Number(process.env.PORT || 3005);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  const cleanPath = decodeURIComponent(req.url.split('?')[0]);
  const requested = path.normalize(cleanPath === '/' ? '/index.html' : cleanPath);
  const candidate = path.join(root, requested);
  const filePath = candidate.startsWith(root) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(root, 'index.html');

  res.setHeader('Content-Type', types[path.extname(filePath)] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend static server running on http://localhost:${port}`);
});
