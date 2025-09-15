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

The backend uses a **RAG pipeline**:

1. **Receive Query:** Backend receives query from frontend via REST API or Socket.io.  
2. **Retrieve Relevant Passages:**  
   - Generate query embeddings using **Jina Embeddings**.  
   - Retrieve top-k relevant passages from **Pinecone** vector DB.  
3. **Generate Response:**  
   - Send retrieved passages to **Google Gemini API** to generate a coherent answer.  
4. **Session Management & Caching:**  
   - Store responses and chat history in **Redis** per session.  
   - History can be fetched or reset.  
5. **Persistence (Optional):**  
   - Store transcripts in **MySQL/PostgreSQL** for analytics or record-keeping.

```mermaid
graph LR
A[User] -->|Send query| B[Frontend (React)]
B -->|API / Socket| C[Backend Express + Socket.io]
C --> D[Vector DB: Pinecone - retrieve top-k embeddings]
D --> E[Google Gemini API - generate answer]
E --> C
C --> F[Redis - session chat history]
C --> B[Return response]
C --> G[MySQL/Postgres - store transcripts]
