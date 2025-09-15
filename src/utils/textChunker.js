// simple char-based chunker with overlap
function chunkText(text, size = 800, overlap = 200){
  const chunks = [];
  let start = 0;
  while (start < text.length){
    const end = Math.min(start + size, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    if (end === text.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}
module.exports = { chunkText };
