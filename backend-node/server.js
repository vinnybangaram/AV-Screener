const express = require("express");
const cors = require("cors");

const app = express();

// ✅ MUST BE FIRST
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("🔥 NEW SERVER VERSION V2");
});

// ✅ MULTIBAGGER
app.get("/api/multibagger", (req, res) => {
  res.json({
    success: true,
    data: [],
    message: "Multibagger route working"
  });
});

// ✅ AI STATUS
app.get("/api/ai-status", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server started on port:", PORT);
});
