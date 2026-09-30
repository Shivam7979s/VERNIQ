# VERNIQ AI Service (`services/ai`)

> **Service Type:** Microservice  
> **Runtime:** Python 3.11+ / FastAPI  
> **Status:** Scaffolding & Architecture Baseline (Phase 0)  

---

## Service Overview

The VERNIQ AI Service manages all intelligent mentorship, code review, and RAG retrieval pipelines. It runs as an independent microservice in an isolated network environment.

### Core Capabilities (Planned for Feature Phases):
1. **Socratic AI Mentor:** Provides contextual hints, guided questions, and pseudo-code breakdowns without directly outputting the complete solution code.
2. **AI Code Review:** Static code analysis, algorithmic time/space complexity evaluation, edge case warnings, and style critique.
3. **Mock Interview Engine:** Interactive technical and behavioral interview simulation with structured scoring rubrics.

### Architecture Contract:
- **Authentication:** Validates incoming requests by verifying the Supabase Auth JWT and checking the caller's session validity.
- **RAG Datastore:** Connects to PostgreSQL `pgvector` store using cosine similarity queries against curriculum embeddings.
- **Output:** Streams tokens back via Server-Sent Events (SSE) for responsive UI rendering.

### Development Setup (Future Phase Activation):
```bash
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```
