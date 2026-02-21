const express = require("express");
const pool = require("./database/db");
const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Backend running" });
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});