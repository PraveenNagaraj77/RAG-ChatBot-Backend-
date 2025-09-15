const { Pinecone } = require('@pinecone-database/pinecone');
const { pinecone } = require('../config');

const VECTOR_SIZE = 1536;

const pineconeClient = new Pinecone({
  apiKey: pinecone.apiKey,
});

console.log('Pinecone client initialized');

const index = pineconeClient.index(pinecone.index);
console.log(`Using Pinecone index: ${pinecone.index}`);

async function upsertPoints(points = []) {
  if (!points.length) {
    console.log('No points to upsert');
    return;
  }

  try {
    const vectors = points.map((p) => ({
      id: p.id.toString(),
      values: p.values,       // must match ingest.js
      metadata: p.metadata || {},
    }));

    console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
    await index.upsert(vectors);  // ✅ just pass the array
    console.log(`Upserted ${vectors.length} points to Pinecone`);

    return { upsertedCount: vectors.length };
  } catch (err) {
    console.error("Pinecone upsertPoints error:", err.message, err.stack);
    throw err;
  }
}
async function searchVector(vector, top = 4) {
  try {
    console.log('Searching Pinecone for top', top, 'vectors...');
    const result = await index.query({
      vector,
      topK: top,
      includeMetadata: true,
    });

    console.log(`Found ${result.matches?.length || 0} matches`);

    if (!result.matches || result.matches.length === 0) {
      console.log("No results found in Pinecone");
    }

    result.matches?.slice(0, 3).forEach((r, i) => {
      console.log(`   [${i + 1}] id=${r.id}, metadata=`, r.metadata);
    });

    return result.matches || [];
  } catch (err) {
    console.error("Pinecone searchVector error:", err.message, err.stack);
    return [];
  }
}

module.exports = { upsertPoints, searchVector };
