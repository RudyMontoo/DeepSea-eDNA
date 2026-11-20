# Project Overview

## What this is

DeepSea eDNA AI classifies marine species from **environmental DNA (eDNA)** —
tiny DNA fragments collected from seawater samples (shed skin, mucus, waste from
fish, shellfish, etc.). Instead of manually matching sequences against reference
databases, a trained neural network predicts which of 8 marine taxonomic groups
a DNA sequence belongs to, with a confidence score.

**Flow:** user uploads a FASTA/FASTQ file (or pastes a raw sequence) → backend
cleans/filters it → the model classifies each sequence → results (species +
confidence) are shown in the dashboard and exportable as a report.

## Live deployment

| Service | URL |
|---|---|
| Frontend (Vercel) | https://deepsea-edna-ai-eta.vercel.app |
| Backend API (Render) | https://deepsea-backend-t9oy.onrender.com |
| API docs (Swagger) | https://deepsea-backend-t9oy.onrender.com/api/docs |

## Tech stack — what does what

### Frontend — `src/`
| Tech | Role |
|---|---|
| **React 19 + TypeScript** | UI framework |
| **Vite** | Dev server & production bundler |
| **Tailwind CSS v4** | Styling |
| **React Router** | Client-side routing (`LoginPage`, `DashboardPage`, `ClassifyPage`, `TaxaExplorerPage`, `ModelsPage`, `ExperimentsPage`, `MonitoringPage`, `AdminPage`, `SettingsPage`) |
| **Zustand** (`src/store/`) | Auth/session state (`authStore.ts`) and toast notifications (`toastStore.ts`); tokens kept in memory + `sessionStorage` |
| **Axios** (`src/lib/api.ts`) | HTTP client — attaches JWT bearer tokens, auto-refreshes on `401`, handles CORS/network errors |
| **TanStack Query** | Server-state caching for API calls |
| **Recharts** | Charts on the Dashboard/Monitoring/Experiments pages |

### Backend — `backend/app/`
| Tech | Role |
|---|---|
| **FastAPI** (`app/main.py`) | REST API — routes for auth, upload, analysis, export, models |
| **Uvicorn** | ASGI server running the FastAPI app |
| **PyTorch** (`app/models/deep_learning.py`) | The actual classifier: DNA embedding → 1D convolutional layers (pattern scanning) → self-attention → taxonomic prediction across 8 classes |
| **BioPython** (`app/services/sequence_processor.py`) | Parses FASTA/FASTQ files, filters low-quality/wrong-length sequences |
| **SQLAlchemy + Alembic** (`app/db/`) | ORM + migrations for the relational schema: users, OAuth accounts, revoked tokens, predictions, analysis jobs |
| **PostgreSQL** | Production database (SQLite is used automatically for local dev when no `DATABASE_URL` is set) |
| **Redis** | Caching layer (falls back to in-memory cache if unavailable) |
| **PyJWT + bcrypt** (`app/core/security.py`) | Password hashing and JWT access/refresh tokens |
| **MLflow** (`app/ml/`, optional) | Model registry/experiment tracking — the backend serves the bundled local model (`ml_models/marine_model/`) when `MLFLOW_TRACKING_URI` isn't set, so MLflow is optional infra, not a hard requirement |
| **Prometheus client** | Exposes `/metrics` for monitoring |
| **mlops/** | Supporting modules: monitoring, model versioning, A/B testing between model versions, cache manager |

### Infrastructure
| Tech | Role |
|---|---|
| **Docker** (`Dockerfile`, `Dockerfile.frontend`) | Container images for backend (Python/PyTorch) and frontend (nginx-served static build) |
| **docker-compose.yml** | Local/self-hosted stack: Postgres + Redis + MLflow + backend + frontend wired together |
| **render.yaml** | Render Blueprint — deploys Postgres, Redis, and the backend as one click (used for the live deployment above) |
| **vercel.json** | Vercel config for the frontend — Vite build settings + SPA routing fallback |
| **deploy/aws/** | Alternative: CloudFormation template for a single EC2 instance running the full docker-compose stack behind CloudFront (not used for the current live deployment) |
| **.github/workflows/** | CI/CD: PR checks, CI/CD pipeline, scheduled model training |

### Data — `data/`, `ml_models/`
- `data/training/marine_diverse/`: ~48,000 training DNA sequences across 8 classes (orders like Perciformes, Salmoniformes, plus Decapoda/crabs and Bivalvia/clams), sourced from MARES, BOLD, NCBI reference databases.
- `ml_models/marine_model/`: the trained model's weights (`best_model.pth`) and config — **94% validation accuracy**.
