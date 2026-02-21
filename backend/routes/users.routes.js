const express = require("express");
const pool = require("../database/db");

const router = express.Router();
// router.get("/", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM users");
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database error" });
//   }
// });

router.get("/", async (req, res) => {
  const { phoneNumber } = req.query;
  try {
    console.log("Received phone number:", phoneNumber);
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [phoneNumber]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
module.exports = router;