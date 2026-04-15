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

---

## Azure deployment plan (free tier)

### Resources to create in Azure
- Resource Group: `rg-cbfp-dev-eus2-01`
- Static Web App (Free): `swa-cbfp-dev-01`
- App Service Plan (F1 Free): `asp-cbfp-dev-free-01`
- Web App for backend API: `app-cbfp-api-dev-01`
- Budget (subscription scope): `budget-cbfp-dev-monthly-01`
- Action Group for budget alerts (optional): `ag-cbfp-dev-cost-01`

### Naming convention
- Prefix: `cbfp` (project short name)
- Environment: `dev`
- Region code: `eus2` for `eastus2`
- Suffix rule by resource type: always end with sequential `-01`
- Collision rule: if name already exists, increment only that resource type to `-02`, then `-03`, etc.

### Deployment steps (excluding phase 6)
1. Local validation (blocking): run backend tests from `backend/` with `uv run pytest`.
2. Local backend check: run `uv run uvicorn app.main:app --reload` and verify `GET /health`.
3. Local frontend check: run `npm run build` from `frontend/`.
4. Confirm production env vars: `ALLOWED_ORIGINS` and `OPENAI_API_KEY` (only if real LLM is enabled).
5. Provision Azure resources: create `rg-cbfp-dev-eus2-01`.
6. Create frontend hosting: create Static Web App Free `swa-cbfp-dev-01`.
7. Create backend hosting: create App Service Plan F1 `asp-cbfp-dev-free-01` and Web App `app-cbfp-api-dev-01`.
8. Configure backend app settings: set `ALLOWED_ORIGINS` to the final Static Web App domain.
9. Deploy backend code: publish API to `app-cbfp-api-dev-01` (Zip Deploy or GitHub Actions).
10. Verify backend in Azure: validate `GET /health` and `POST /api/chat/`.
11. Deploy frontend code: publish built frontend to `swa-cbfp-dev-01`.
12. End-to-end validation: open frontend URL and verify chat request/response flow.
13. Cost guardrails: create `budget-cbfp-dev-monthly-01` with low threshold alert (for example, $1).
14. Optional notifications: connect alert to `ag-cbfp-dev-cost-01`.

### Name increment examples
- If `swa-cbfp-dev-01` already exists, use `swa-cbfp-dev-02`.
- If `app-cbfp-api-dev-01` already exists, use `app-cbfp-api-dev-02`.
- Do not increment unrelated resource types when only one name collides.

### Azure CLI commands (`az`)

> These commands are a baseline for the resources and names defined above. If a name is already taken, increment only that resource type (`-01` -> `-02`).

```powershell
# 0) Prerequisites
az login
az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"

# Variables
$RG = "rg-cbfp-dev-eus2-01"
$LOC = "eastus2"
$SWA_NAME = "swa-cbfp-dev-01"
$PLAN_NAME = "asp-cbfp-dev-free-01"
$WEBAPP_NAME = "app-cbfp-api-dev-01"
$BUDGET_NAME = "budget-cbfp-dev-monthly-01"
$AG_NAME = "ag-cbfp-dev-cost-01"

# 1) Resource group
az group create --name $RG --location $LOC

# 2) Static Web App (Free)
# Requires repo and branch for integrated CI/CD.
az staticwebapp create `
  --name $SWA_NAME `
  --resource-group $RG `
  --location $LOC `
  --sku Free `
  --source "https://github.com/<ORG_OR_USER>/<REPO>" `
  --branch "main" `
  --app-location "frontend" `
  --output-location "dist"

# 3) App Service Plan F1 + Web App (Linux)
az appservice plan create `
  --name $PLAN_NAME `
  --resource-group $RG `
  --location $LOC `
  --sku F1 `
  --is-linux

az webapp create `
  --name $WEBAPP_NAME `
  --resource-group $RG `
  --plan $PLAN_NAME `
  --runtime "PYTHON|3.12"

# 4) Backend app settings (set ALLOWED_ORIGINS after obtaining SWA default hostname)
$SWA_HOSTNAME = az staticwebapp show --name $SWA_NAME --resource-group $RG --query "defaultHostname" -o tsv
az webapp config appsettings set `
  --name $WEBAPP_NAME `
  --resource-group $RG `
  --settings `
    ALLOWED_ORIGINS="https://$SWA_HOSTNAME" `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Optional, only if real LLM is enabled:
# az webapp config appsettings set --name $WEBAPP_NAME --resource-group $RG --settings OPENAI_API_KEY="<SECRET>"

# 5) Deploy backend (run from repo root; creates zip from backend folder)
cd backend
if (Test-Path backend.zip) { Remove-Item backend.zip -Force }
Compress-Archive -Path * -DestinationPath backend.zip -Force
az webapp deploy `
  --resource-group $RG `
  --name $WEBAPP_NAME `
  --src-path backend.zip `
  --type zip
cd ..

# 6) Verify backend
az webapp show --name $WEBAPP_NAME --resource-group $RG --query "defaultHostName" -o tsv
# Health check URL: https://<WEBAPP_DEFAULT_HOSTNAME>/health

# 7) Create monthly budget at subscription scope (US$1)
$SUB_ID = az account show --query id -o tsv
$START_DATE = "2026-04-01"
$END_DATE = "2027-04-01"

az consumption budget create `
  --budget-name $BUDGET_NAME `
  --scope "/subscriptions/$SUB_ID" `
  --amount 1 `
  --category cost `
  --time-grain monthly `
  --start-date $START_DATE `
  --end-date "$END_DATE"

# 8) Optional Action Group for budget notifications
az monitor action-group create `
  --name $AG_NAME `
  --resource-group $RG `
  --short-name "cbfpcost"
```
