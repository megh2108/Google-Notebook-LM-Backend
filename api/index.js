const express = require("express");
const path = require("path");
require("dotenv").config();

const corsConfig = require("./config/corsConfig");
const documentRoutes = require("./routes/documentRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// Middleware
app.use(corsConfig);
app.use(express.json());

// Static file serving for PDFs
const uploadsPath = path.join(process.cwd(), "uploads"); 
app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pdf")) {
        res.set("Content-Type", "application/pdf");
        res.set("Content-Disposition", "inline");
        res.set("Access-Control-Allow-Origin", "*");
      }
    },
  })
);

// Routes
app.use("/api/document", documentRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

// ✅ Important: No app.listen() here — Vercel handles this
module.exports = app;
