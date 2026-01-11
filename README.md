# 📘 Trade Finance Blockchain Explorer

## 📌 Project Overview

The **Trade Finance Blockchain Explorer** is a full-stack web application designed to digitally manage and track **trade finance documents** such as **Letters of Credit, Invoices, Bills of Lading, and Purchase Orders** in a **secure, transparent, and auditable** manner.

The system ensures **document integrity** using cryptographic hash values and maintains an **immutable audit trail (ledger)** of all important actions like upload, access, verification, modification, and integrity validation.

This project is developed as part of the **Infosys Springboard Virtual Internship 6.0**.

---

## 🎯 Project Objectives

- Digitize trade finance document management
- Ensure document integrity using SHA-256 hash values
- Detect document tampering using runtime hash comparison
- Implement secure authentication and authorization
- Enforce role-based and organisation-based access
- Maintain an immutable audit trail for compliance
- Provide an Integrity Dashboard for Admin & Auditor

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control:

  - Admin
  - Auditor
  - Bank
  - Corporate

---

### 📄 Document Management

- Upload and update trade finance documents
- Automatic SHA-256 hash generation
- Organisation-specific document visibility
- Secure file storage

---

### 🧾 Ledger / Audit Trail

- Immutable log of all document events:

  - `UPLOADED`
  - `ACCESSED`
  - `VERIFIED`
  - `MODIFIED`
  - `INTEGRITY_FAILED`

- Ledger acts as a **legal audit trail**
- Viewable by Admin and Auditor

---

### 🔍 Integrity Check System (Admin & Auditor)

The Integrity module verifies that documents have **not been tampered with** after upload.

**Capabilities:**

- Run integrity checks on:

  - All documents
  - Specific document IDs

- Runtime hash recomputation
- Compare:

  - Stored hash (original)
  - Computed hash (current)

- Status results:

  - `PASSED` – File unchanged
  - `FAILED` – Hash mismatch / File missing
  - `PENDING` – File inaccessible or unreadable

**Integrity Dashboard Displays:**

- Total checks
- Passed / Failed / Pending counts
- Filter tabs: All / Passed / Failed / Pending
- Detailed table:

  - Document ID
  - Check Type
  - Stored Hash
  - Computed Hash
  - Status
  - Timestamp

---

### 🚨 Alert System (Admin & Auditor)

- Failed integrity checks generate **alerts**
- Alerts include:

  - Document ID
  - Failure reason (Missing file / Hash mismatch)

- Admin/Auditor can:

  - View active alerts
  - Acknowledge alerts

- Acknowledgement means:

  > “This issue has been noticed and will be investigated.”

---

### 👥 User Management

- Admin can view all users
- Role and organisation assigned to each user

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
- Passlib (Password Hashing)

---

## 🔑 User Roles & Access Control

| Role          | Permissions                                                  |
| ------------- | ------------------------------------------------------------ |
| **Admin**     | Manage users, run integrity checks, view alerts & ledger     |
| **Auditor**   | Read-only access, run integrity checks, view ledger & alerts |
| **Bank**      | View documents of own organisation                           |
| **Corporate** | Upload and update documents of own organisation              |

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── auth.py
│   │   ├── crud.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   │   ├── documents.py
│   │   │   ├── ledger.py
│   │   │   ├── integrity.py
│   │   │   └── users.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 🚀 How to Run the Project

### 🔹 Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

Swagger UI:

```
http://127.0.0.1:8000/docs
```

---

### 🔹 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🔐 Environment Variables

### Frontend (`.env`)

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 👥 Project Team

This project was developed as a **group project** under the
**Infosys Springboard Virtual Internship 6.0**.

- **Group Name:** Group C
- **Team Size:** 6 Members

### Team Members

- Bhavana Uddanti
- Kashish Badkhal
- Vinay Jalla
- Kanishka P
- Harish Karthik
- Jaya

**Domain:** Full-Stack Web Development

---

## 🏁 Conclusion

The **Trade Finance Blockchain Explorer** is not just a document management system—it is a **compliance-grade integrity platform**. By combining:

- Cryptographic hashing
- Runtime integrity verification
- Alerts & acknowledgement flow
- Immutable ledger

it demonstrates how blockchain-inspired principles can be applied to real-world trade finance to ensure **trust, transparency, and fraud detection**.

---
