const axios = require('axios');
const { gemini } = require('../config');

async function generateAnswer(prompt) {
  try {
    const res = await axios.post(
      gemini.url,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': gemini.key
        }
      }
    );

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Sorry, no response from Gemini";

    console.log('Gemini answer:', text);
    return text;

  } catch (err) {
    console.error('Gemini generateAnswer error:', err.response?.data || err.message);
    return 'Sorry, I could not generate a response at this time.';
  }
}

module.exports = { generateAnswer };
