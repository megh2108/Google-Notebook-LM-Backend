const express = require("express");
const { chatWithDocument } = require("../controllers/chatController");

const router = express.Router();

router.post("/", chatWithDocument);

module.exports = router;
