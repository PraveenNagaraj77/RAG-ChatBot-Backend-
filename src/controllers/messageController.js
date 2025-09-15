const redisService = require('../services/redisService');
const mysqlService = require('../services/mysqlService');
const embeddingsService = require('../services/embeddingsService');
const vectorService = require('../services/vectorService');
const llmService = require('../services/llmService');
const { buildPrompt } = require('../utils/promptBuilder');
const { topK } = require('../config');

async function handleMessage(req, res) {
  const { id: sessionId } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const userMsg = { role: 'user', text, ts: new Date().toISOString() };
  await redisService.pushMessage(sessionId, userMsg);
  await mysqlService.saveMessage(sessionId, 'user', text);

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

  const botMsg = { role: 'assistant', text: answer, ts: new Date().toISOString() };
  await redisService.pushMessage(sessionId, botMsg);
  await mysqlService.saveMessage(sessionId, 'assistant', answer);

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
}

module.exports = { handleMessage };
