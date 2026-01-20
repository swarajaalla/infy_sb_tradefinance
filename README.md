# Trade Finance Management System (Infy SB – Group A)

A full‑stack Trade Finance Management System implementing role-based workflows for Corporates, Banks, Admins, and Auditors. Backend is built with FastAPI + SQLAlchemy and PostgreSQL; frontend is a React (Vite) SPA with Tailwind CSS. Features include trade lifecycle management, document upload (S3), ledger entries, and role-based dashboards.

---

## Table of Contents

- Project overview
- Features
- Tech stack
- Repository structure (actual)
- Backend — setup & run (Windows)
- Frontend — setup & run (Windows)
- Environment variables
- Important API endpoints
- Frontend pages & components
- Trade status flow & ACL
- S3 document handling
- Testing & debugging
- Deployment notes
- Contributing
- License

---

## Features

- JWT authentication and role-based access control (Corporate, Bank, Admin, Auditor)
- Trade CRUD with controlled status transitions and ledger logging
- Document upload & secure storage (AWS S3 integration)
- Admin user management and reporting endpoints
- Frontend protected routes and role-specific dashboards

---

## Tech Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, boto3 (S3), python-jose (JWT)
- Frontend: React (Vite), Axios, Tailwind CSS
- Dev: Uvicorn, npm/Yarn

---

## Repository Structure (actual)

Backend (c:\Trade Finance\Backend)
- requirements.txt
- app/
  - __init__.py
  - .env
  - main.py
  - database.py
  - models.py
  - schema.py
  - routers.py
  - trade_routes.py
  - document_routes.py
  - ledger_routes.py
  - admin_routes.py
  - report_routes.py
  - risk_routes.py
  - s3.py
  - auth/
    - __init__.py
    - dependencies.py
    - jwt_handler.py
    - routes.py

Frontend (c:\Trade Finance\frontend)
- index.html
- package.json
- vite.config.js
- tailwind.config.js
- src/
  - main.jsx
  - App.jsx
  - App.css, index.css
  - api/axios.js
  - components/
    - Layout.jsx
    - Navbar.jsx
    - ProtectedRoute.jsx
  - pages/
    - Login.jsx
    - Register.jsx
    - Dashboard.jsx
    - Trades.jsx
    - Documents.jsx
    - LedgerEntries.jsx
    - AdminUsers.jsx
    - Reports.jsx
    - RiskDashboard.jsx
    - IntegrityCheckPage.jsx

---

## Backend — Setup (Windows)

1. Open PowerShell, create & activate venv:
   ```powershell
   cd "c:\Trade Finance\Backend"
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # or venv\Scripts\activate
   ```

2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Environment file:
   - Place a `.env` in `c:\Trade Finance\Backend\app\` (example below).

4. Initialize DB (ensure PostgreSQL running and DB created):
   - If app exposes Base metadata, run:
   ```powershell
   python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```
   - Otherwise run migrations if configured.

5. Run backend:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   Open: http://127.0.0.1:8000
   Swagger: http://127.0.0.1:8000/docs

---

## Frontend — Setup (Windows)

1. Install dependencies:
   ```powershell
   cd "c:\Trade Finance\frontend"
   npm install
   ```

2. Run dev server:
   ```powershell
   npm run dev
   ```
   Open: http://localhost:5173

3. Build for production:
   ```powershell
   npm run build
   ```

---

## Environment Variables

Create `c:\Trade Finance\Backend\app\.env` with at least:

```
DATABASE_URL=postgresql://username:password@localhost:5432/tradefinance
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region
```

Frontend: if you need runtime variables (API base url) create an .env in frontend root (Vite): VITE_API_URL=http://127.0.0.1:8000

---

## Key API Endpoints (implemented files)

Auth (app/auth/routes.py)
- POST /auth/register
- POST /auth/login

Trades (app/trade_routes.py)
- POST /trades/                 — create trade
- GET /trades/                  — list / filter trades
- GET /trades/{id}              — get trade
- PATCH /trades/{id}/status     — update status (validated transitions)

Documents (app/document_routes.py)
- POST /documents/upload        — upload file to S3
- GET /documents/{id}/download  — signed URL / download

Ledger (app/ledger_routes.py)
- GET /ledger/{trade_id}        — ledger entries for trade

Admin & Reporting
- app/admin_routes.py
- app/report_routes.py
- app/risk_routes.py

Use Swagger (/docs) to view full schemas and authorization flows.

---

## Frontend Pages & Flows

- Login/Register — authentication (JWT saved to localStorage; axios uses interceptors in src/api/axios.js)
- Dashboard — role-aware home
- Trades — list/create/update trades, assign bank
- Documents — upload and view documents (S3 signed URLs)
- LedgerEntries — view per-trade ledger history
- AdminUsers — user management UI (Admin role)
- Reports / RiskDashboard / IntegrityCheckPage — specialized pages for reporting and audit checks

Protected routes handled by src/components/ProtectedRoute.jsx.

---

## Trade Status Flow & Access Control

Supported lifecycle (backend enforces allowed transitions):
created → lc_requested → lc_issued → lc_advised → shipped → docs_submitted → docs_verified → completed

- Corporates: create trades, upload documents, assign banks
- Banks: verify documents, advance statuses where permitted
- Admin: manage users and system data
- Auditor: readonly access to trades & ledgers

---

## S3 Document Handling

- s3.py contains S3 helpers. Ensure AWS keys and bucket exist and IAM policy grants PutObject/GetObject.
- document_routes.py returns pre-signed URLs for downloads and may accept multipart uploads for server-side proxy.

---

## Testing & Troubleshooting

- Use Swagger UI (/docs) to exercise endpoints and validate request/response.
- Common issues:
  - DB connection error: verify DATABASE_URL, DB running, user permissions
  - Missing env vars: confirm .env and restart server
  - S3 upload errors: check AWS keys and bucket region
  - CORS: ensure backend CORS allows frontend origin (127.0.0.1:5173)

---

## Production & Deployment Notes

- Use environment-specific secrets (do NOT commit .env)
- Serve backend with Uvicorn workers via Gunicorn (linux) or systemd service
- Use HTTPS (TLS) and secure cookies/localStorage patterns for tokens
- Consider Docker + Docker Compose: Postgres, backend, frontend, and a reverse proxy (Nginx)
- Configure logging and monitoring for production

---

## Contributing

- Create feature branch, add tests where applicable, open PR with description
- Keep secrets out of repo; use environment variables or secret manager

---

## License

Add a LICENSE file (e.g., MIT) at repo root and state license here.

---