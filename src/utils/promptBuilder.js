function buildPrompt(question, retrievedChunks) {
  let context = 'Here are some recent news articles:\n\n';

  retrievedChunks.forEach((c, i) => {
    const id = i + 1;
    context += `[${id}] Title: ${c.title || 'Untitled'}\n`;
    if (c.url) context += `URL: ${c.url}\n`;
    context += `Content: ${c.text || 'No content'}\n\n`;
  });

  return `
You are a helpful AI news assistant. 
Answer the user’s question based only on the news articles below.

${context}

USER QUESTION: "${question}"

Guidelines:
- Write in a natural, conversational style (like ChatGPT).
- If multiple articles are relevant, combine them into a clear summary instead of listing raw snippets.
- Always cite sources with [number] (e.g., [1], [2]).
- If none of the articles are relevant, respond with: "I couldn't find relevant info in the articles."
- Avoid repeating the article text verbatim. Summarize and explain instead.
`;
}

module.exports = { buildPrompt };
