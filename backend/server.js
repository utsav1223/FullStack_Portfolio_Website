require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { MongoClient } = require('mongodb');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'portfolio.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const DESKTOP_FRAMES_DIR = path.join(ROOT, 'photos_zip');
const PHONE_FRAMES_DIR = path.join(ROOT, 'phone_photo');
const DIST_DIR = path.join(ROOT, 'frontend', 'dist');
const PREFERRED_PORT = Number(process.env.PORT) || 3000;
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'utsav@2027';

const MONGODB_URI = (process.env.MONGODB_URI || '').trim();
const MONGODB_DB = (process.env.MONGODB_DB || 'portfolio').trim();

const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
  });
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(express.json({ limit: '12mb' }));

let mongoClient = null;
let storeCollection = null;
let authStore = null;

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createInitialAuthData() {
  const salt = crypto.randomBytes(16).toString('hex');
  const tokenSecret = crypto.randomBytes(32).toString('hex');
  return {
    salt,
    passwordHash: hashPassword(DEFAULT_PASSWORD, salt),
    tokenSecret,
  };
}

function readLocalPortfolio() {
  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(parsed.certifications)) {
    parsed.certifications = [];
  }
  return parsed;
}

function writeLocalPortfolio(data) {
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

async function initStorage() {
  if (MONGODB_URI) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(MONGODB_DB);
    storeCollection = db.collection('portfolio_store');

    const existingAuth = await storeCollection.findOne({ _id: 'admin_auth' });
    if (existingAuth) {
      authStore = {
        salt: existingAuth.salt,
        passwordHash: existingAuth.passwordHash,
        tokenSecret: existingAuth.tokenSecret,
      };
    } else {
      authStore = createInitialAuthData();
      await storeCollection.insertOne({ _id: 'admin_auth', ...authStore });
    }

    const existingPortfolio = await storeCollection.findOne({ _id: 'main' });
    if (!existingPortfolio && fs.existsSync(DATA_FILE)) {
      const seedData = readLocalPortfolio();
      await storeCollection.insertOne({ _id: 'main', data: seedData });
    }
    return;
  }

  if (!fs.existsSync(AUTH_FILE)) {
    authStore = createInitialAuthData();
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authStore, null, 2), 'utf8');
  } else {
    authStore = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  }
}

async function saveAuthStore(nextAuth) {
  authStore = nextAuth;
  if (storeCollection) {
    await storeCollection.updateOne(
      { _id: 'admin_auth' },
      { $set: nextAuth },
      { upsert: true }
    );
  } else {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(nextAuth, null, 2), 'utf8');
  }
}

async function readPortfolio() {
  if (storeCollection) {
    const doc = await storeCollection.findOne({ _id: 'main' });
    const data = doc?.data || readLocalPortfolio();
    if (!Array.isArray(data.certifications)) {
      data.certifications = [];
    }
    return data;
  }
  return readLocalPortfolio();
}

async function writePortfolio(data) {
  if (storeCollection) {
    await storeCollection.updateOne(
      { _id: 'main' },
      { $set: { data, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return;
  }
  writeLocalPortfolio(data);
}

function verifyPassword(password) {
  if (!password || typeof password !== 'string' || !authStore) return false;
  const candidate = Buffer.from(hashPassword(password, authStore.salt), 'hex');
  const stored = Buffer.from(authStore.passwordHash, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}

function createToken() {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', authStore.tokenSecret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.') || !authStore) return false;
  const [payload, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', authStore.tokenSecret)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please unlock Manage with your admin password.' });
    return;
  }
  next();
}

function validatePortfolio(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Payload must be a JSON object.';
  }
  const requiredKeys = ['header', 'education', 'skills', 'experiences', 'projects', 'achievements'];
  for (const key of requiredKeys) {
    if (!(key in payload)) {
      return `Missing required section: ${key}`;
    }
  }
  if (!Array.isArray(payload.experiences) || !Array.isArray(payload.projects) || !Array.isArray(payload.achievements)) {
    return 'experiences, projects, and achievements must be arrays.';
  }
  if ('certifications' in payload && !Array.isArray(payload.certifications)) {
    return 'certifications must be an array.';
  }
  if (!payload.skills || typeof payload.skills !== 'object' || Array.isArray(payload.skills)) {
    return 'skills must be an object grouped by category.';
  }
  return null;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    storage: {
      database: storeCollection ? 'mongodb-atlas' : 'local-json',
      media: useCloudinary ? 'cloudinary' : 'local-disk',
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};
  if (!verifyPassword(password)) {
    res.status(401).json({ error: 'Invalid password.' });
    return;
  }
  res.json({ ok: true, token: createToken() });
});

app.get('/api/auth/verify', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!verifyPassword(currentPassword)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }

  try {
    const salt = crypto.randomBytes(16).toString('hex');
    await saveAuthStore({
      salt,
      passwordHash: hashPassword(newPassword, salt),
      tokenSecret: authStore.tokenSecret,
    });
    res.json({ ok: true, token: createToken() });
  } catch {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

app.get('/api/portfolio', async (_req, res) => {
  try {
    res.json(await readPortfolio());
  } catch {
    res.status(500).json({ error: 'Failed to read portfolio data.' });
  }
});

app.put('/api/portfolio', requireAdmin, async (req, res) => {
  const validationError = validatePortfolio(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const normalized = {
      ...req.body,
      certifications: Array.isArray(req.body.certifications) ? req.body.certifications : [],
    };
    await writePortfolio(normalized);
    res.json(normalized);
  } catch {
    res.status(500).json({ error: 'Failed to save portfolio data.' });
  }
});

app.post('/api/upload/resume', requireAdmin, async (req, res) => {
  const { fileName, dataBase64 } = req.body || {};
  if (!fileName || !dataBase64 || typeof dataBase64 !== 'string') {
    res.status(400).json({ error: 'fileName and dataBase64 are required.' });
    return;
  }

  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeName.toLowerCase().endsWith('.pdf')) {
    res.status(400).json({ error: 'Only PDF resumes are supported.' });
    return;
  }

  try {
    const portfolio = await readPortfolio();
    portfolio.header.resumeFileName = safeName;

    if (useCloudinary) {
      const dataUri = dataBase64.startsWith('data:')
        ? dataBase64
        : `data:application/pdf;base64,${dataBase64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'portfolio/resume',
        resource_type: 'raw',
        public_id: `resume_${Date.now()}.pdf`,
      });
      portfolio.header.resumeUrl = result.secure_url;
      await writePortfolio(portfolio);
      res.json({ ok: true, resumeFileName: safeName, url: '/api/resume', storage: 'cloudinary' });
      return;
    }

    const cleanBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(path.join(UPLOADS_DIR, 'resume.pdf'), buffer);
    portfolio.header.resumeUrl = '';
    await writePortfolio(portfolio);

    res.json({ ok: true, resumeFileName: safeName, url: '/api/resume', storage: 'local-disk' });
  } catch {
    res.status(500).json({ error: 'Failed to upload resume PDF.' });
  }
});

app.get('/api/resume', async (_req, res) => {
  try {
    const portfolio = await readPortfolio();
    if (portfolio?.header?.resumeUrl) {
      res.redirect(portfolio.header.resumeUrl);
      return;
    }
    const targetPath = path.join(UPLOADS_DIR, 'resume.pdf');
    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'No resume uploaded yet.' });
      return;
    }
    const downloadName = portfolio?.header?.resumeFileName || 'resume.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    fs.createReadStream(targetPath).pipe(res);
  } catch {
    res.status(500).json({ error: 'Failed to load resume.' });
  }
});

app.post('/api/upload/project-image', requireAdmin, async (req, res) => {
  const { fileName, dataBase64 } = req.body || {};
  if (!fileName || !dataBase64 || typeof dataBase64 !== 'string') {
    res.status(400).json({ error: 'fileName and dataBase64 are required.' });
    return;
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    res.status(400).json({ error: 'Only JPG, PNG, or WEBP images are supported.' });
    return;
  }

  try {
    if (useCloudinary) {
      const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      const dataUri = dataBase64.startsWith('data:')
        ? dataBase64
        : `data:${mimeMap[ext]};base64,${dataBase64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'portfolio/projects',
        resource_type: 'image',
      });
      res.json({ ok: true, url: result.secure_url, storage: 'cloudinary' });
      return;
    }

    const cleanBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const savedName = `${safeBase}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, savedName), buffer);
    res.json({ ok: true, url: `/uploads/${savedName}`, storage: 'local-disk' });
  } catch {
    res.status(500).json({ error: 'Failed to upload project image.' });
  }
});

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

app.use(
  '/photos_zip',
  express.static(DESKTOP_FRAMES_DIR, {
    maxAge: '1d',
    immutable: true,
  })
);

app.use(
  '/phone_photo',
  express.static(PHONE_FRAMES_DIR, {
    maxAge: '1d',
    immutable: true,
  })
);

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('/{*splat}', (req, res, next) => {
    if (
      req.path.startsWith('/api/') ||
      req.path.startsWith('/photos_zip/') ||
      req.path.startsWith('/phone_photo/') ||
      req.path.startsWith('/uploads/')
    ) {
      next();
      return;
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res
      .status(503)
      .send('Frontend build not found. Run "npm run build" or use Vite dev server.');
  });
}

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

function listen(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Local:   http://localhost:${port}`);
    for (const { name, url } of getLanUrls(port)) {
      console.log(`Network (${name}): ${url}`);
    }
    console.log(
      `Storage: db=${storeCollection ? 'mongodb-atlas' : 'local-json'}, media=${useCloudinary ? 'cloudinary' : 'local-disk'}`
    );
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      listen(port + 1);
      return;
    }
    throw err;
  });
}

initStorage()
  .then(() => listen(PREFERRED_PORT))
  .catch((err) => {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  });
