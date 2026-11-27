const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = __dirname;
const PREFERRED_PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const relativePath = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
  const fullPath = path.resolve(ROOT, relativePath);

  if (!fullPath.startsWith(ROOT + path.sep) && fullPath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': contentType };

    if (ext === '.jpg' || ext === '.jpeg') {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    res.writeHead(200, headers);
    fs.createReadStream(fullPath).pipe(res);
  });
});

function getLanUrls(port) {
  const urls = [];
  const interfaces = os.networkInterfaces();
  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        urls.push({ name, url: `http://${entry.address}:${port}` });
      }
    }
  }
  return urls;
}

function start(port) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      start(port + 1);
      return;
    }
    throw err;
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Local:   http://localhost:${port}`);
    for (const { name, url } of getLanUrls(port)) {
      console.log(`Network (${name}): ${url}`);
    }
  });
}

start(PREFERRED_PORT);
