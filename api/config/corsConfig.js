const cors = require("cors");

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://google-notebook-lm-frontend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
};

module.exports = cors(corsOptions);
