const { v4: uuidv4 } = require('uuid');
const mysqlService = require('../services/mysqlService');
const redisService = require('../services/redisService');

async function createSession(req, res) {
  const sessionId = uuidv4();
  await mysqlService.createSession(sessionId);
  res.json({ sessionId });
}

async function getHistory(req, res) {
  const { id } = req.params;

  try {
    const redisHistory = await redisService.getSessionHistory(id);
    if (redisHistory && redisHistory.length) {
      return res.json({ history: redisHistory.reverse() });
    }

    const rows = await mysqlService.getMessages(id);
    const history = rows
      .map(r => ({
        role: r.role,
        text: r.content,
        ts: r.created_at
      }))
      .sort((a, b) => new Date(a.ts) - new Date(b.ts));

    return res.json({ history });
  } catch (err) {
    console.error("Error fetching history:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function resetSession(req, res) {
  const { id } = req.params;
  await redisService.clearSession(id);
  await mysqlService.clearSession(id);
  res.json({ ok: true });
}

module.exports = { createSession, getHistory, resetSession };
