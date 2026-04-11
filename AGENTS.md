# AGENTS.md

## Project structure

Two independent sub-projects; each has its own dependency manager and must be run separately.

```
chatbot-fp/
├── backend/   # FastAPI — Python 3.13, uv
└── frontend/  # Vite + TypeScript (vanilla, no framework), npm
```

---

## Backend

### Setup
```bash
cd backend
cp .env.example .env    # required before first run
uv sync --group dev
```

### Dev server
```bash
# from backend/
uv run uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Tests
```bash
# must run from backend/ — pythonpath is set to "." in pyproject.toml
uv run pytest
uv run pytest tests/test_chat.py::test_health   # single test
```

### Non-obvious quirks
- **No `requirements.txt`.** Package manager is `uv` exclusively. `uv.lock` is the lockfile.
- **`pytest` breaks if run from repo root** — `app` won't be importable. Always run from `backend/`.
- `asyncio_mode = "auto"` is set in `pyproject.toml`; no `@pytest.mark.asyncio` needed on test functions.
- CORS reads `ALLOWED_ORIGINS` from `.env` (comma-separated). During local dev the Vite proxy handles CORS, so this only matters in production.
- **To connect a real LLM: edit only `backend/app/services/chat_service.py`.** The stub shows an OpenAI example in comments. Add `OPENAI_API_KEY` to `.env`.

### API contract
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/health` | — | `{"status": "ok"}` |
| POST | `/api/chat/` | `{"message": "<string>"}` | `{"respuesta": "<string>"}` |

The response field is **`respuesta`** (Spanish). Missing `message` returns HTTP 422.

---

## Frontend

### Setup
```bash
cd frontend
npm install
```

### Dev server
```bash
# from frontend/
npm run dev
# → http://localhost:5173
```
All `/api/*` requests are proxied by Vite to `http://localhost:8000` — no CORS configuration needed in development.

### Type-check + build
```bash
npm run build   # runs: tsc && vite build — type errors fail the build
```

### Non-obvious quirks
- **TypeScript 6** (`~6.0.2`) with `erasableSyntaxOnly` enabled — **`enum` and `namespace` are banned**. Use `const` objects or union types instead.
- `noUnusedLocals` and `noUnusedParameters` are enabled. Unused variables break the build.
- **No framework** — pure vanilla TS. Components are plain classes/functions with DOM APIs.
- **No frontend tests and no linter** (no ESLint, no Ruff). Only TypeScript compiler flags enforce quality.
- URL linkification in bot responses is handled in `src/components/ChatWindow.ts` via regex.

---

## Conventions
- All user-visible strings, UI labels, error messages, and code comments are in **Spanish**.
- The shared data shape (`respuesta` field) is mirrored in:
  - `backend/app/models/chat.py` — Pydantic `ChatResponse`
  - `frontend/src/types/index.ts` — TypeScript `ChatResponse`
  - Both must stay in sync when the API contract changes.
- No CI, no pre-commit hooks. Verification is manual: `uv run pytest` + `npm run build`.
