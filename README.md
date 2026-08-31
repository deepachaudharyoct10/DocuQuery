# DocuQuery

A full-stack document intelligence system: upload documents, ask questions about their
content with grounded, cited answers, and detect contradictions across sources.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| App DB | MongoDB Atlas |
| Vector DB | Qdrant Cloud |
| File storage | Cloudinary |
| LLM | Gemini 1.5/2.0 Flash |
| Embeddings | Gemini `text-embedding-004` |

## Project Structure

```
DocuQuery/
├── backend/    Express + TypeScript API
└── frontend/   Next.js app
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your MongoDB/Qdrant/Cloudinary/Gemini credentials
npm run dev             # http://localhost:5000
```

Required environment variables (see `backend/.env.example`):

- `MONGODB_URI` — MongoDB Atlas connection string
- `QDRANT_URL`, `QDRANT_API_KEY` — Qdrant Cloud instance
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY` — Google AI Studio key

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend URL
npm run dev             # http://localhost:3000
```

## How It Works

**Ingestion:** upload → validate → store in Cloudinary → extract text (pdf-parse /
mammoth / raw read) → chunk with overlap → embed with Gemini → upsert to Qdrant with
metadata → mark document `completed`/`failed` in MongoDB.

**Chat (RAG):** question → embed → Qdrant similarity search → retrieved chunks passed
to Gemini with instructions to answer only from context and cite sources → answer +
citations returned, conversation history stored in MongoDB.

**Contradiction detection:** on each chat query, the retrieved chunks are paired across
different source documents and judged by Gemini for genuine contradictions (factual,
logical, temporal, numerical), explicitly avoiding false positives on document
revisions/updates. Confirmed contradictions are stored and can be marked resolved or
false positive from the dashboard.

## API Overview

```
POST   /api/documents/upload
GET    /api/documents
DELETE /api/documents/:id

POST   /api/chat
GET    /api/conversations/:id

GET    /api/contradictions
PATCH  /api/contradictions/:id
```

## Deployment

- Frontend → Vercel
- Backend → Render
