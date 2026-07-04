const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("HR Bot Running");
});

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on", PORT));

require("./bot");