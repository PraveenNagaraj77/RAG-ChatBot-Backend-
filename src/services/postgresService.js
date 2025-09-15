require('dotenv').config();
const { Pool } = require('pg');
const config = require('../config').postgres;

let pool;

async function init() {
  try {
    pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: { rejectUnauthorized: false }
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id UUID PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        status VARCHAR(10) DEFAULT 'active'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
        role VARCHAR(10),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS sources JSONB;
    `);
  } catch (err) {
    console.error('Postgres init error:', err.message);
  }
}

async function createSession(sessionId) {
  try {
    await pool.query(
      `INSERT INTO sessions (session_id, status)
       VALUES ($1, 'active')
       ON CONFLICT (session_id) DO UPDATE 
       SET status='active', closed_at=NULL`,
      [sessionId]
    );
  } catch (err) {
    console.error('createSession error:', err.message);
  }
}

async function closeSession(sessionId) {
  try {
    await pool.query(
      'UPDATE sessions SET closed_at = NOW(), status = $1 WHERE session_id = $2',
      ['ended', sessionId]
    );
  } catch (err) {
    console.error('closeSession error:', err.message);
  }
}

async function saveMessage(sessionId, role, content, sources = null) {
  try {
    await createSession(sessionId);
    await pool.query(
      'INSERT INTO messages (session_id, role, content, sources) VALUES ($1, $2, $3, $4)',
      [sessionId, role, content, sources ? JSON.stringify(sources) : null]
    );
  } catch (err) {
    console.error('saveMessage error:', err.message);
  }
}

async function getMessages(sessionId) {
  try {
    const { rows } = await pool.query(
      'SELECT role, content, sources, created_at FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    return rows.map(r => ({
      role: r.role,
      content: r.content,
      ts: r.created_at,
      sources: r.sources || []
    }));
  } catch (err) {
    console.error('getMessages error:', err.message);
    return [];
  }
}

async function clearSession(sessionId) {
  try {
    await pool.query('DELETE FROM messages WHERE session_id = $1', [sessionId]);
    await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
  } catch (err) {
    console.error('clearSession error:', err.message);
  }
}

function getPool() {
  if (!pool) throw new Error('Postgres pool not initialized');
  return pool;
}

process.on('SIGINT', async () => {
  if (pool) await pool.end();
  process.exit(0);
});

module.exports = {
  init,
  createSession,
  closeSession,
  saveMessage,
  getMessages,
  clearSession,
  getPool
};
