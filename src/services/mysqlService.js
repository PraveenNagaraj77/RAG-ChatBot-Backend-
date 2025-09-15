const mysql = require('mysql2/promise');
const config = require('../config').mysql;

let pool;

async function init() {
  try {
    pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id CHAR(36) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        status ENUM('active','ended') DEFAULT 'active'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        session_id CHAR(36),
        role ENUM('user','assistant'),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
      );
    `);

    console.log('MySQL initialized and tables ready!');
  } catch (err) {
    console.error('MySQL init error:', err.message);
  }
}

async function createSession(sessionId) {
  try {
    await pool.execute(
      `INSERT INTO sessions (session_id, status) VALUES (?, 'active')
       ON DUPLICATE KEY UPDATE status='active', closed_at=NULL`,
      [sessionId]
    );
  } catch (err) {
    console.error('createSession error:', err.message);
  }
}

async function closeSession(sessionId) {
  try {
    await pool.execute(
      'UPDATE sessions SET closed_at = NOW(), status = ? WHERE session_id = ?',
      ['ended', sessionId]
    );
  } catch (err) {
    console.error('closeSession error:', err.message);
  }
}

async function saveMessage(sessionId, role, content) {
  try {
    await pool.execute(
      `INSERT INTO sessions (session_id, status) VALUES (?, 'active')
       ON DUPLICATE KEY UPDATE status='active', closed_at=NULL`,
      [sessionId]
    );

    await pool.execute(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      [sessionId, role, content]
    );
  } catch (err) {
    console.error('saveMessage error:', err.message);
  }
}

async function getMessages(sessionId) {
  try {
    const [rows] = await pool.execute(
      'SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
    return rows;
  } catch (err) {
    console.error('getMessages error:', err.message);
    return [];
  }
}

async function clearSession(sessionId) {
  try {
    await pool.execute('DELETE FROM messages WHERE session_id = ?', [sessionId]);
    await pool.execute('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
    console.log(`Cleared session and messages for sessionId=${sessionId}`);
  } catch (err) {
    console.error('clearSession error:', err.message);
  }
}

function getPool() {
  if (!pool) throw new Error('MySQL pool not initialized');
  return pool;
}

process.on('SIGINT', async () => {
  if (pool) await pool.end();
  console.log('MySQL pool closed');
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
