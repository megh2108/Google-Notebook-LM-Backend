const genAI = require("../config/geminiConfig");
const { documentsStore } = require("./documentController");

exports.chatWithDocument = async (req, res) => {
  try {
    const { fileId, message, chatHistory = [] } = req.body;
    const document = documentsStore.get(fileId);

    if (!document) return res.status(404).json({ error: "Document not found" });

    const context = `You are analyzing a PDF document titled "${document.name}".
                    Document content:
                    ${document.text.substring(0, 10000)}...
                    Chat history:
                    ${chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}
                    User question: ${message}
                    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(context);
    const text = result.response.text();

    res.json({ success: true, response: text, timestamp: new Date() });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
};
