const axios = require('axios');
const { jina } = require('../config');

async function embed(texts = []) {
  try {
    if (!Array.isArray(texts)) texts = [texts];
    if (!texts.length) return [];

    console.log('Embedding request texts:', texts);

    const res = await axios.post(
      jina.url,
      {
        model: 'jina-embeddings-v3',
        task: 'text-matching',
        input: texts
      },
      {
        headers: {
          Authorization: `Bearer ${jina.key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Raw Jina response:', res.data);

    if (res.data?.data) {
      const embeddings = res.data.data.map(item => item.embedding);
      console.log('Generated embeddings length:', embeddings.map(e => e.length));
      return embeddings;
    }

    console.warn('No embeddings returned from Jina');
    return [];
  } catch (err) {
    console.error('Jina embed error:', err.response?.data || err.message);
    return [];
  }
}

module.exports = { embed };
