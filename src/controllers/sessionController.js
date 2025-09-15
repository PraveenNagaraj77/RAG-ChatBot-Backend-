const { v4: uuidv4 } = require('uuid');
const mysqlService = require('../services/mysqlService');
const postgresService = require('../services/postgresService');
const redisService = require('../services/redisService');

const dbService = process.env.NODE_ENV === 'production' ? postgresService : mysqlService;

async function createSession(req, res) {
  try {
    const sessionId = uuidv4();
    await dbService.createSession(sessionId);
    res.json({ sessionId });
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getHistory(req, res) {
  const { id } = req.params;

  try {
    const redisHistory = await redisService.getSessionHistory(id);
    if (redisHistory && redisHistory.length) {
      return res.json({ history: redisHistory.reverse() });
    }

    const rows = await dbService.getMessages(id);
    const history = rows
      .map(r => ({
        role: r.role,
        text: r.content,
        ts: r.created_at
      }))
      .sort((a, b) => new Date(a.ts) - new Date(b.ts));

    return res.json({ history });
  } catch (err) {
    console.error("getHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function resetSession(req, res) {
  const { id } = req.params;
  try {
    await redisService.clearSession(id);
    await dbService.clearSession(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("resetSession error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createSession, getHistory, resetSession };
