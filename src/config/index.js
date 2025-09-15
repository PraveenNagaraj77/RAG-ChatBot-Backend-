require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL,
  redisCloudUrl: process.env.REDIS_CLOUD_URL,
  sessionTtl: parseInt(process.env.SESSION_TTL_SECONDS || '86400', 10),

  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  },

  postgres: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    index: process.env.PINECONE_INDEX || 'news-index'
  },

  jina: {
    url: process.env.JINA_API_URL,
    key: process.env.JINA_API_KEY
  },

  gemini: {
    url: process.env.GEMINI_API_URL,
    key: process.env.GEMINI_API_KEY
  },

  topK: parseInt(process.env.TOP_K || '4', 10)
};
