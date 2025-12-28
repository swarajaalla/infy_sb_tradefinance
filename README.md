# 📘 Trade Finance Blockchain Explorer

## 📌 Project Overview

The **Trade Finance Blockchain Explorer** is a full-stack web application designed to digitally manage and track **trade finance documents** such as **Letters of Credit, Invoices, Bills of Lading, and Purchase Orders** in a **secure, transparent, and auditable** manner.

The system ensures **document integrity** using cryptographic hash values and maintains an **immutable audit trail (ledger)** of all important actions like upload, access, verification, and modification.

This project is developed as part of the **Infosys Springboard Virtual Internship 6.0**.

---

## 🎯 Project Objectives

* Digitize trade finance document management
* Ensure document integrity using SHA-256 hash values
* Implement secure authentication and authorization
* Enforce role-based and organisation-based access
* Maintain an audit trail for transparency and compliance
* Provide a simple blockchain-inspired ledger view

---

## ✨ Key Features

* 🔐 **Authentication & Authorization**

  * JWT-based authentication
  * Role-based access control (Admin, Auditor, Bank, Corporate)

* 📄 **Document Management**

  * Upload and update trade finance documents
  * Automatic hash generation for each document
  * Organisation-specific document visibility

* 🧾 **Ledger / Audit Trail**

  * Immutable log of all document events:

    * UPLOADED
    * ACCESSED
    * VERIFIED
    * MODIFIED
  * Viewable only by auditors

* 👥 **User Management**

  * Admin can view all users
  * Role and organisation assigned to each user

* 📊 **Dashboard**

  * Displays logged-in user role and organisation details

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Vite
* Axios
* React Router

### Backend

* FastAPI
* SQLModel
* PostgreSQL
* JWT Authentication
* Passlib (Password Hashing)

---

## 🔑 User Roles & Access Control

| Role          | Permissions                                       |
| ------------- | ------------------------------------------------- |
| **Admin**     | View all users, manage system                     |
| **Auditor**   | Read-only access to all documents and full ledger |
| **Bank**      | View documents belonging to own organisation      |
| **Corporate** | Upload and update documents for own organisation  |

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

⚠️ This file is not committed to GitHub for security reasons.

---

## 🧪 Sample Document Data

```json
{
  "doc_type": "INVOICE",
  "doc_number": "INV-2025-001",
  "issued_at": "2025-12-20",
  "hash": "a94a8fe5ccb19ba61c4c0873d391e987"
}
```

---

## 👥 Project Team

This project was developed as a **group project** under the
**Infosys Springboard Virtual Internship 6.0**.

* **Group Name:** Group C
* **Team Size:** 6 Members

### Team Members

* Bhavana Uddanti
* Kashish Badkhal
* Vinay Jalla
* Kanishka P
* Harish Karthik
* Jaya

**Domain:** Full-Stack Web Development

---

## 🔮 Future Enhancements

* Blockchain network integration for true immutability
* Refresh token support
* Organisation-wise analytics dashboard
* Advanced audit reports
* File version comparison
* Download and export ledger reports

---

## 🏁 Conclusion

The **Trade Finance Blockchain Explorer** provides a **secure, role-based, and auditable document management platform** inspired by blockchain principles. It demonstrates how modern web technologies can be applied to solve real-world trade finance challenges with transparency and trust.

---