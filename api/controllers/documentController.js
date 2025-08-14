const fs = require("fs");
const pdfParse = require("pdf-parse");

const documents = new Map();

if (!fs.existsSync("uploads")) {
    const tempDir = path.join("/tmp", "uploads");
    fs.mkdirSync(tempDir, { recursive: true });
}

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const fileId = req.file.filename;

        const dataBuffer = fs.readFileSync(filePath);
        const pdfBase64 = dataBuffer.toString("base64");
        const pdfData = await pdfParse(dataBuffer);

        documents.set(fileId, {
            id: fileId,
            name: fileName,
            base64: pdfBase64,
            text: pdfData.text,
            pages: pdfData.numpages,
            uploadedAt: new Date(),
        });

        res.json({
            success: true,
            fileId,
            fileName,
            pages: pdfData.numpages,
            base64: pdfBase64,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to process PDF" });
    }
};

exports.getDocument = (req, res) => {
    const { fileId } = req.params;
    const document = documents.get(fileId);

    if (!document) return res.status(404).json({ error: "Document not found" });
    res.json(document);
};

exports.searchDocument = (req, res) => {
    try {
        const { fileId, query } = req.body;
        const document = documents.get(fileId);

        if (!document) return res.status(404).json({ error: "Document not found" });

        const text = document.text.toLowerCase();
        const searchQuery = query.toLowerCase();

        const matches = [];
        let index = 0;
        while ((index = text.indexOf(searchQuery, index)) !== -1) {
            const start = Math.max(0, index - 100);
            const end = Math.min(text.length, index + searchQuery.length + 100);
            matches.push({
                snippet: document.text.substring(start, end),
                position: index,
            });
            index += searchQuery.length;
            if (matches.length >= 10) break;
        }

        res.json({ success: true, matches });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to search document" });
    }
};

exports.documentsStore = documents;
