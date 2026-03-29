const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../config/db");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/research");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.pdf$/i.test(file.originalname);
    if (!ok) return cb(new Error("Only PDF uploads are allowed"));
    cb(null, true);
  },
});

const promisePool = () => db.promise();

const listDocuments = async (req, res) => {
  try {
    const pool = promisePool();
    const [rows] = await pool.query(
      `SELECT id, title, source_type, source_url, excerpt, tags, created_at, file_path,
        CASE WHEN file_path IS NOT NULL THEN 1 ELSE 0 END AS has_file
       FROM research_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to list documents", error: err.message });
  }
};

const addNoteOrUrl = async (req, res) => {
  const { title, source_type, source_url, excerpt, tags } = req.body;
  if (!title || String(title).trim().length < 2) {
    return res.status(400).json({ message: "Title is required" });
  }
  const st = source_type === "url" ? "url" : "note";
  try {
    const pool = promisePool();
    const [r] = await pool.query(
      `INSERT INTO research_documents (user_id, title, source_type, source_url, excerpt, tags)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), st, st === "url" ? source_url || null : null, excerpt || null, tags || null]
    );
    const [rows] = await pool.query("SELECT * FROM research_documents WHERE id = ?", [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to save", error: err.message });
  }
};

const uploadPdf = [
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "PDF file required" });
    const title = (req.body.title || req.file.originalname).trim();
    const excerpt =
      (req.body.excerpt || "").trim() ||
      "PDF stored in your research library. Add an excerpt or notes when editing.";
    const rel = path.relative(path.join(__dirname, "../.."), req.file.path).replace(/\\/g, "/");
    try {
      const pool = promisePool();
      const [r] = await pool.query(
        `INSERT INTO research_documents (user_id, title, source_type, file_path, excerpt, tags)
         VALUES (?, ?, 'upload', ?, ?, ?)`,
        [req.user.id, title, rel, excerpt, req.body.tags || null]
      );
      const [rows] = await pool.query("SELECT * FROM research_documents WHERE id = ?", [r.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ message: "Failed to save document", error: err.message });
    }
  },
];

const deleteDocument = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: "Invalid id" });
  try {
    const pool = promisePool();
    const [rows] = await pool.query(
      "SELECT id, file_path FROM research_documents WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const fp = rows[0].file_path;
    await pool.query("DELETE FROM research_documents WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (fp) {
      const abs = path.join(__dirname, "../..", fp);
      fs.unlink(abs, () => {});
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

module.exports = {
  listDocuments,
  addNoteOrUrl,
  uploadPdf,
  deleteDocument,
  uploadMiddleware: upload,
};
