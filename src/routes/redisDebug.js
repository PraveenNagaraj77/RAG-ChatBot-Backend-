
const express = require("express");
const router = express.Router();
const { client } = require("../services/redisService");

router.get("/redis-status", async (req, res) => {
  try {
    const keys = await client.keys("session:*");
    res.json({ status: "ok", keys });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

module.exports = router;
