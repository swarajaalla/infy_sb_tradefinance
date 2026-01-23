# 📘 Trade Finance Blockchain Explorer

## 📌 Project Overview

The **Trade Finance Blockchain Explorer** is a full-stack web application that digitally manages and tracks **end-to-end trade finance workflows** in a secure, transparent, and auditable manner.

It simulates how real-world trade finance systems work between:

- **Buyers**
- **Sellers**
- **Banks**
- **Regulators (Admin & Auditor)**

The platform ensures:

- Secure trade creation and lifecycle tracking
- Document integrity using cryptographic hashes (SHA-256)
- Role-based business rule enforcement
- Immutable audit ledger for compliance
- Automated background verification using Celery
- Risk scoring and analytics dashboards

This project is developed as part of the
**Infosys Springboard Virtual Internship 6.0**.

---

## 🎯 Project Objectives

- Digitize trade finance workflows
- Track full trade lifecycle digitally
- Ensure document integrity using cryptographic hashing
- Detect document tampering at runtime
- Enforce role-based access and business rules
- Maintain an immutable audit trail
- Automate heavy tasks using background workers
- Provide dashboards for risk, integrity, and analytics

---

## ✨ Core Modules

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control:
  - **Admin**
  - **Auditor**
  - **Bank**
  - **Corporate** (Buyer / Seller)

Each API is protected by role and ownership rules.

---

### 🔄 Trade Lifecycle Management

Trades follow a real-world business flow:

```
INITIATED
   ↓
SELLER_CONFIRMED
   ↓
DOCUMENTS_UPLOADED
   ↓
BANK_ASSIGNED
   ↓
SHIPPED
   ↓
BANK_REVIEWING
   ↓
BANK_APPROVED
   ↓
PAYMENT_RELEASED
   ↓
COMPLETED
```

- Buyers create trades
- Sellers confirm and upload documents
- Buyers assign banks
- Sellers mark shipment
- Banks review & approve
- Payment is released and trade completes

Each transition is:

- Role-restricted
- Validated against allowed flow
- Logged in the ledger

---

### 📄 Document Management

- Upload trade documents (Invoice, Shipping, LC, etc.)
- Automatic SHA-256 hash generation
- Trade-linked storage
- Organisation-based access control
- Secure file storage

---

### 🧾 Ledger / Audit Trail

Every important action is logged:

- `TRADE_CREATED`
- `SELLER_CONFIRMED`
- `DOCUMENT_UPLOADED`
- `BANK_ASSIGNED`
- `SHIPPED`
- `BANK_APPROVED`
- `PAYMENT_RELEASED`
- `COMPLETED`
- `INTEGRITY_FAILED`

The ledger acts as a **legal-grade immutable audit trail**
Visible to Admin & Auditor.

---

### 🔍 Integrity Check System

Admin and Auditor can run integrity checks on:

- All documents
- Specific document IDs

The system:

1. Recomputes file hash at runtime
2. Compares with stored hash
3. Assigns status:

| Status  | Meaning                         |
| ------- | ------------------------------- |
| PASSED  | File unchanged                  |
| FAILED  | Hash mismatch / File missing    |
| PENDING | File inaccessible or unreadable |

- Failed checks generate:
  - Integrity Alerts
  - Ledger entries (`INTEGRITY_FAILED`)

---

### 🚨 Alert System

- Alerts are raised when integrity fails
- Admin/Auditor can:
  - View active alerts
  - Acknowledge alerts

Acknowledgement means:

> “This issue has been noticed and will be investigated.”

---

### 📊 Risk & Analytics

- Risk score computed per trade
- Risk recomputation API
- Analytics endpoints for:
  - Trade volume
  - Status distribution
  - Risk distribution
  - Compliance metrics

Enables dashboards for:

- Banks
- Regulators
- Auditors

---

### ⚙️ Background Automation

Heavy operations like integrity checks run asynchronously using:

- **Celery** – Task queue
- **Redis** – Message broker

This ensures:

- API remains responsive
- Long tasks run in background
- Enterprise-grade backend behavior

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Tailwind CSS
- Vite
- Axios
- React Router

### Backend

- FastAPI
- SQLModel
- PostgreSQL
- JWT Authentication
- Celery + Redis
- Passlib

---

## 🔑 User Roles

| Role      | Capabilities                                                |
| --------- | ----------------------------------------------------------- |
| Admin     | Manage users, run integrity, view alerts, ledger, analytics |
| Auditor   | Read-only, run integrity, view ledger & alerts              |
| Bank      | Review trades, approve, update banking stages               |
| Corporate | Create trades, upload documents, manage trade lifecycle     |

---

## 🚀 How to Run

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

Swagger UI:

```
http://127.0.0.1:8000/docs
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

## 🏁 Conclusion

The **Trade Finance Blockchain Explorer** is a
**compliance-grade digital trade platform**.

By combining:

- Cryptographic hashing
- Role-driven trade workflows
- Immutable audit ledger
- Integrity & alerting system
- Risk analysis
- Background automation

…it demonstrates how **blockchain-inspired trust models** can be applied to real-world trade finance systems, ensuring:

> **Trust, Transparency, and Tamper Detection** in every transaction.

---
