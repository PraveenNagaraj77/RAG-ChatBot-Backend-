# RAG-Powered News Chatbot - Backend

### Live Backend Service
[https://rag-chatbot-backend-service.onrender.com](https://rag-chatbot-backend-service.onrender.com)

This is the **backend** for the RAG-powered news chatbot. It handles query processing, embeddings, vector DB retrieval, LLM API calls, session management, caching, and optional transcript storage.

---

### Tech Stack

- **Embeddings:** Jina Embeddings  
- **Vector DB:** Pinecone  
- **LLM API:** Google Gemini  
- **Backend:** Node.js (Express) + Socket.io  
- **Cache & Sessions:** Redis  
- **Database:** MySQL / PostgreSQL (for transcripts)  

---

### Architecture & Flow

The backend uses a **RAG pipeline** to answer queries over news articles:

1. **Ingested Articles:**  
   - ~50 news articles were ingested from **RSS feeds**.  
   - The ingestion was done manually initially and is now scheduled to run automatically every day via **GitHub Actions**.  
   - Articles are stored in the backend for indexing.

2. **Receive Query:**  
   - Backend receives a query from frontend via REST API or Socket.io.

3. **Retrieve Relevant Passages:**  
   - Generate embeddings for the query using **Jina Embeddings**.  
   - Retrieve top-k relevant passages from **Pinecone** vector DB (indexed from the ingested 50 articles).

4. **Generate Response:**  
   - Send retrieved passages to **Google Gemini API** to generate a coherent, contextual answer.

5. **Session Management & Caching:**  
   - Store responses and chat history in **Redis** per session.  
   - History can be fetched or reset.

6. **Persistence (Optional):**  
   - Store transcripts in **MySQL/PostgreSQL** for analytics or record-keeping.

**Flow Summary in Plain Text:**

- User sends query → Frontend (React) → Backend Express + Socket.io → Retrieve top-k relevant articles from Pinecone → Google Gemini API generates response → Store in Redis → Return response to frontend → Optional transcript saved in MySQL/Postgres.

---

### API Endpoints

| Endpoint              | Method | Description                              |
|----------------------|--------|------------------------------------------|
| `/chat`               | POST   | Send a user query and get a response     |
| `/:sessionId/history` | GET    | Fetch chat history for a session         |
| `/:sessionId/reset`   | POST   | Reset/clear chat history                 |
| `/health`             | GET    | Health check endpoint                     |

**Example Request:**

```json
POST /chat
{
  "sessionId": "1234-5678",
  "message": "Tell me the latest news about AI"
}
