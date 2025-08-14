const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadPDF,
  getDocument,
  searchDocument,
} = require("../controllers/documentController");

const router = express.Router();

// ✅ Detect environment and set upload directory
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel ? path.join("/tmp", "uploads") : path.join(__dirname, "../uploads");

// ✅ Ensure the directory exists
fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname),
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Routes
router.post("/upload", upload.single("pdf"), uploadPDF);
router.get("/:fileId", getDocument);
router.post("/search", searchDocument);

module.exports = router;
