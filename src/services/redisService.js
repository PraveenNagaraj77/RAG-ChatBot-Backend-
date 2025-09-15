const { createClient } = require('redis');
const { redisUrl, redisCloudUrl, nodeEnv, sessionTtl } = require('../config');

const redisConnectionUrl = nodeEnv === 'production' ? redisCloudUrl : redisUrl;

console.log(`Using Redis URL: ${redisConnectionUrl} (${nodeEnv === 'production' ? 'Cloud' : 'Local'})`);

const client = createClient({
  url: redisConnectionUrl,
  socket: {
    tls: false,
  }
});

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
  return items.map(i => JSON.parse(i)).reverse();
}

async function pushMessage(sessionId, msg) {
  const key = `session:${sessionId}:history`;
  await client.rPush(key, JSON.stringify(msg));
  await client.expire(key, parseInt(sessionTtl || '86400', 10));
}

async function clearSession(sessionId) {
  const key = `session:${sessionId}:history`;
  await client.del(key);
}

module.exports = { client, connectRedis, getSessionHistory, pushMessage, clearSession };
