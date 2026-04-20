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
- No automated quality CI (tests/build) and no pre-commit hooks yet. Verification is manual: `uv run pytest` + `npm run build`.
- Deployment automation is planned via GitHub Actions (see Azure deployment plan stages).

---

## Azure deployment plan (free tier)

### IaC tooling
- **Infrastructure as Code: Bicep** — all Azure resources are declared in `infra/main.bicep`.
- Deployment command: `az deployment group create` (after creating the resource group manually).
- The resource group itself is created imperatively with `az group create` since Bicep requires an existing scope.

### Resources to create in Azure
- Resource Group: `rg-cbfp-dev-01`
- Static Web App (Free): `swa-cbfp-dev-cus-01`
- App Service Plan (F1 Free): `asp-cbfp-dev-free-cac-01`
- Web App for backend API: `app-cbfp-api-dev-cac-01`

### Naming convention
- Prefix: `cbfp` (project short name)
- Environment: `dev`
- Region code: `cus` for `centralus` (solo SWA) y `cac` for `canadacentral` (ASP + Web App)
- Suffix rule by resource type: always end with sequential `-01`
- Collision rule: if name already exists, increment only that resource type to `-02`, then `-03`, etc.

### IaC structure
```
infra/
├── main.bicep          # declares SWA, ASP, Web App; accepts parameters
└── main.bicepparam     # parameter values for the dev environment
```

Key Bicep parameters:
- `swaLocation` — `centralus`
- `appLocation` — `canadacentral`
- `swaName` — `swa-cbfp-dev-02`
- `aspName` — `asp-cbfp-dev-free-01`
- `webAppName` — `app-cbfp-api-dev-01`
- `allowedOrigins` — SWA default hostname (set after first deploy or passed as override)

### Two-stage rollout plan

### Stage 1 — Provision Azure resources (one-time or on infra changes)
1. Pre-flight quota check: verify Free VM quota in `canadacentral` — `az vm list-usage --location canadacentral`.
2. Create resource group (imperative — scope required by Bicep):
   `az group create --name rg-cbfp-dev-cac-01 --location canadacentral`
3. Deploy infrastructure with Bicep (idempotent):
   `az deployment group create --resource-group rg-cbfp-dev-cac-01 --template-file infra/main.bicep --parameters infra/main.bicepparam`
4. Retrieve SWA hostname from deployment output and confirm `ALLOWED_ORIGINS` is correct in Web App settings.

### Stage 2 — Continuous deployment with GitHub Actions
1. Create CI/CD workflows in `.github/workflows/` so deployment happens from GitHub Actions, not from local machines.
2. Add a backend workflow (`deploy-backend.yml`) with jobs to: checkout, setup Python/uv, run `uv run pytest` from `backend/`, package app, and deploy to `app-cbfp-api-dev-01` (Zip Deploy or `azure/webapps-deploy`).
3. Add a frontend workflow (`deploy-frontend.yml`) with jobs to: checkout, setup Node, run `npm ci` + `npm run build` from `frontend/`, and publish `frontend/dist/` to `swa-cbfp-dev-02`.
4. Configure required repository secrets for workflows (at minimum): `AZURE_CREDENTIALS`, `AZURE_WEBAPP_NAME`, `AZURE_RESOURCE_GROUP`, `AZURE_STATIC_WEB_APPS_API_TOKEN`, and `OPENAI_API_KEY` if real LLM is enabled.
5. Configure required app settings in Azure for runtime (`ALLOWED_ORIGINS` and optional `OPENAI_API_KEY`) so deployment and execution remain decoupled.
6. Use trigger strategy: automatic on push to `main`, plus `workflow_dispatch` for controlled/manual releases.
7. Add post-deploy smoke tests as workflow steps: verify backend `GET /health`, `POST /api/chat/`, and end-to-end call from SWA URL.
8. Use environment protection rules for production (required reviewers/approvals) before deploy jobs execute.

### Re-deploy / update rules
- Infrastructure updates: re-run Stage 1, step 3. Bicep is idempotent and performs incremental updates by default.
- Application-only updates: use Stage 2 GitHub Actions workflows without reprovisioning infrastructure.
- To change a parameter (e.g., `ALLOWED_ORIGINS`), update `infra/main.bicepparam` and re-run Stage 1, step 3.

### Name increment examples
- If `swa-cbfp-dev-01` already exists, use `swa-cbfp-dev-02`.
- If `app-cbfp-api-dev-01` already exists, use `app-cbfp-api-dev-02`.
- Do not increment unrelated resource types when only one name collides.

