process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Parser = require('rss-parser');
const { embed } = require('../services/embeddingsService');
const { upsertPoints } = require('../services/vectorService');

const parser = new Parser();


function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<\/?[^>]+(>|$)/g, '') // remove HTML tags
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim();
}

async function fetchArticles() {
  const feeds = [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"
  ];

  let articles = [];
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      const parsed = feed.items.map((item, i) => ({
        id: `${url}-${i}`,
        title: item.title,
        url: item.link,
        content: cleanText(item.contentSnippet || item.content || item.summary || item.title)
      }));
      articles = articles.concat(parsed);
    } catch (err) {
      console.error(`Failed to fetch feed ${url}:`, err.message);
    }
  }


  articles = articles.filter(a => a.content && a.content.length > 20);

  return articles.slice(0, 50);
}

async function embedArticles(articles) {
  const points = [];
  for (const article of articles) {
    try {
      const [vector] = await embed(article.content);

      if (!vector || vector.length === 0) {
        console.warn(`Skipping article ${article.id}: embedding failed or empty`);
        continue;
      }

      points.push({
        id: article.id,
        values: vector, 
        metadata: {
          title: article.title,
          url: article.url,
          text: article.content
        }
      });
    } catch (err) {
      console.error(`Failed embedding article ${article.id}:`, err.message);
    }
  }
  return points;
}

async function ingestNews() {
  console.log('Fetching articles...');
  const articles = await fetchArticles();
  console.log(`Fetched ${articles.length} valid articles`);

  const points = await embedArticles(articles);
  console.log(`Prepared ${points.length} embeddings for upsert`);

  if (points.length > 0) {
    console.log(`Upserting ${points.length} points to Pinecone...`);
    await upsertPoints(points);
    console.log('Ingestion complete!');
  } else {
    console.log('No valid embeddings to upsert.');
  }
}

ingestNews().catch(err => {
  console.error('Ingestion script failed:', err);
});
