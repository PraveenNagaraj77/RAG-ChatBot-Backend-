const redisService = require('../services/redisService');
const mysqlService = require('../services/mysqlService');
const postgresService = require('../services/postgresService');
const embeddingsService = require('../services/embeddingsService');
const vectorService = require('../services/vectorService');
const llmService = require('../services/llmService');
const { buildPrompt } = require('../utils/promptBuilder');
const { topK } = require('../config');

const dbService = process.env.NODE_ENV === 'production' ? postgresService : mysqlService;

async function handleMessage(req, res) {
  try {
    const { id: sessionId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const userMsg = { role: 'user', text, ts: new Date().toISOString() };
    await redisService.pushMessage(sessionId, userMsg);
    await dbService.saveMessage(sessionId, 'user', text);

    const [embedding] = await embeddingsService.embed([text]);
    const searchRes = await vectorService.searchVector(embedding, topK);
    const matches = searchRes?.matches || searchRes || [];

    const retrieved = matches.map(r => {
      const meta = r.payload || r.metadata || {};
      return {
        id: r.id,
        title: meta.title || 'Untitled',
        url: meta.url || '',
        text: meta.text || meta.text_excerpt || 'No content available'
      };
    });

    const prompt = buildPrompt(text, retrieved);
    const answer = await llmService.generateAnswer(prompt);

    const botMsg = { role: 'assistant', text: answer, ts: new Date().toISOString(), sources: retrieved };
    await redisService.pushMessage(sessionId, botMsg);
    await dbService.saveMessage(sessionId, 'assistant', answer, retrieved);

    res.json({
      answer,
      sources: retrieved.map((r, i) => ({
        id: i + 1,
        title: r.title,
        url: r.url,
        excerpt: r.text
      }))
    });

    console.log('User query:', text);
  } catch (err) {
    console.error('handleMessage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleMessage };
