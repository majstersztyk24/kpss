const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Upewnij się, że są katalogi
[UPLOAD_DIR, DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, '[]', 'utf-8');

app.use(cors());
app.use(express.json());

// Serwowanie zdjęć
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d' }));

// Serwowanie statycznego frontu
app.use('/', express.static(path.join(__dirname, 'public')));

// Konfiguracja Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const allowed = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // max 6 plików, 5MB każdy
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') && (allowed.has(file.mimetype) || true)) {
      cb(null, true);
    } else {
      cb(new Error('Nieprawidłowy typ pliku. Dozwolone są tylko obrazy.'));
    }
  }
});

function readPosts() {
  try {
    const raw = fs.readFileSync(POSTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
}

// API: lista ogłoszeń
app.get('/api/posts', (req, res) => {
  const posts = readPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// API: szczegóły ogłoszenia
app.get('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Nie znaleziono ogłoszenia' });
  res.json(post);
});

// API: dodawanie ogłoszenia
app.post('/api/posts', upload.array('images', 6), (req, res) => {
  try {
    const { title, description, price, contact, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Wymagane: tytuł i opis' });
    }
    const files = req.files || [];
    const images = files.map(f => `/uploads/${f.filename}`);

    const newPost = {
      id: uuidv4(),
      title: String(title).trim(),
      description: String(description).trim(),
      price: price ? String(price).trim() : '',
      contact: contact ? String(contact).trim() : '',
      location: location ? String(location).trim() : '',
      images,
      createdAt: new Date().toISOString()
    };

    const posts = readPosts();
    posts.push(newPost);
    writePosts(posts);

    res.status(201).json(newPost);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Błąd przy zapisie ogłoszenia' });
  }
});

// (opcjonalnie) usuwanie ogłoszenia - do dopisania wg potrzeb

app.listen(PORT, () => {
  console.log(`Serwer działa: http://localhost:${PORT}`);
});
