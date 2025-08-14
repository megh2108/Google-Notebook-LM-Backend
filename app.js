const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 6000;


// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware - IMPORTANT: Don't use express.json() for file upload routes
// In your server.js, update the static files middleware:
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      // These headers are crucial for PDF display
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'inline; filename="file.pdf"');
      res.set('Access-Control-Allow-Origin', '*');
    }
  }
}));

app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Initialize Google Generative AI
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Store document data in memory (in production, use a database)
const documents = new Map();

// Upload PDF endpoint
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileId = req.file.filename;

    // Read file as Base64
    const dataBuffer = fs.readFileSync(filePath);
    const pdfBase64 = dataBuffer.toString('base64');
    const pdfData = await pdfParse(dataBuffer);

    // Store document data
    documents.set(fileId, {
      id: fileId,
      name: fileName,
      base64: pdfBase64,  // Store the Base64 data
      text: pdfData.text,
      pages: pdfData.numpages,
      uploadedAt: new Date(),
    });

    res.json({
      success: true,
      fileId: fileId,
      fileName: fileName,
      pages: pdfData.numpages,
      base64: pdfBase64,  // Send to frontend
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

// Get document info
app.get("/api/document/:fileId", (req, res) => {
  const { fileId } = req.params;
  const document = documents.get(fileId);

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  res.json(document);
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { fileId, message, chatHistory = [] } = req.body;

    console.log("req.body:", req.body);

    const document = documents.get(fileId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Prepare context for Gemini
    const context = `
You are analyzing a PDF document titled "${document.name}".

Document content:
${document.text.substring(0, 10000)}...

Please answer the user's question based on this document. If you reference specific information, try to indicate which part of the document it comes from.

Chat history:
${chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

User question: ${message}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("model:", model);
    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      response: text,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
});

// Search in document
app.post("/api/search", (req, res) => {
  try {
    const { fileId, query } = req.body;

    const document = documents.get(fileId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Simple text search (in production, use proper search indexing)
    const text = document.text.toLowerCase();
    const searchQuery = query.toLowerCase();

    const matches = [];
    let index = 0;
    while ((index = text.indexOf(searchQuery, index)) !== -1) {
      const start = Math.max(0, index - 100);
      const end = Math.min(text.length, index + searchQuery.length + 100);
      const snippet = document.text.substring(start, end);

      matches.push({
        snippet: snippet,
        position: index,
      });

      index += searchQuery.length;
      if (matches.length >= 10) break; // Limit results
    }

    res.json({
      success: true,
      matches: matches,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search document" });
  }
});

app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "Backend server is working!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
