const express = require("express");
const multer = require("multer");
const {
  uploadPDF,
  getDocument,
  searchDocument,
} = require("../controllers/documentController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/upload", upload.single("pdf"), uploadPDF);
router.get("/:fileId", getDocument);
router.post("/search", searchDocument);

module.exports = router;
