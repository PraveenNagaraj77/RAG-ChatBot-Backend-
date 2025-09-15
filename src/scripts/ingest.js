process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Parser = require('rss-parser');
const { embed } = require('../services/embeddingsService');
const { upsertPoints } = require('../services/vectorService');

const parser = new Parser();

async function fetchArticles() {
  const feeds = [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"
  ];

  let articles = [];
  for (const url of feeds) {
    const feed = await parser.parseURL(url);
    const parsed = feed.items.map((item, i) => ({
      id: `${url}-${i}`,
      title: item.title,
      url: item.link,
      content: item.contentSnippet || item.content || item.summary || item.title
    }));
    articles = articles.concat(parsed);
  }

  return articles.slice(0, 50);
}

async function embedArticles(articles) {
  const points = [];
  for (const article of articles) {
    try {
      const [vector] = await embed(article.content);
      points.push({
        id: article.id,
        vector,
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
  console.log(`Got ${articles.length} articles`);

  const points = await embedArticles(articles);
  console.log(`Upserting ${points.length} articles to Pinecone...`);

  await upsertPoints(points);
  console.log('Ingestion complete!');
}

ingestNews().catch(console.error);
