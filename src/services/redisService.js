const { createClient } = require('redis');
const { redisUrl } = require('../config');

const client = createClient({ url: redisUrl });

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis client connected'));
client.on('ready', () => console.log('Redis client ready'));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log('Connected to Redis');
  }
}

async function getSessionHistory(sessionId) {
  const key = `session:${sessionId}:history`;
  const items = await client.lRange(key, 0, -1);
  const parsed = items.map(i => JSON.parse(i)).reverse();
  console.log(`Retrieved ${parsed.length} messages from session ${sessionId}`);
  return parsed;
}

async function pushMessage(sessionId, msg) {
  const key = `session:${sessionId}:history`;
  await client.rPush(key, JSON.stringify(msg));
  await client.expire(key, parseInt(process.env.SESSION_TTL_SECONDS || '86400', 10));
  console.log(`Pushed message to session ${sessionId}:`, msg);
}

async function clearSession(sessionId) {
  const key = `session:${sessionId}:history`;
  await client.del(key);
  console.log(`Cleared session history for ${sessionId}`);
}

module.exports = { client, connectRedis, getSessionHistory, pushMessage, clearSession };
