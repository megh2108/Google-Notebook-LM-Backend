const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const corsConfig = require("./config/corsConfig");
const documentRoutes = require("./routes/documentRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(corsConfig);
app.use(express.json());

// Static file serving for PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".pdf")) {
      res.set("Content-Type", "application/pdf");
      res.set("Content-Disposition", "inline");
      res.set("Access-Control-Allow-Origin", "*");
    }
  }
}));

// Routes
app.use("/api/document", documentRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

// Start server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
