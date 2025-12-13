# 📘 Trade Finance Blockchain Explorer

## 📌 Project Overview

The **Trade Finance Blockchain Explorer** is a full-stack web application developed to digitally manage and track **trade finance documents** such as Letters of Credit, Invoices, Bills of Lading, and Insurance Certificates in a **secure and transparent manner**.

The application focuses on **document integrity**, **role-based access control**, and **organisation-level visibility**, making trade finance processes more reliable and auditable.

This project is developed as part of the **Infosys Springboard Virtual Internship 6.0**.

---

## 🎯 Project Objectives

* To digitize trade finance document management
* To ensure document integrity using hash values
* To implement secure authentication and authorization
* To provide role-based and organisation-based access
* To improve transparency and auditability in trade finance workflows

---

## ✨ Key Features

* 🔐 **Authentication & Authorization**

  * JWT-based authentication
  * Role-based access control (Admin, Auditor, Bank, Corporate)

* 📄 **Document Management**

  * Create and view trade finance documents
  * Store document metadata and hash values
  * Organisation-specific document visibility

* 👥 **User Management**

  * Admin and Auditor can view all users
  * Other roles have restricted access

* 📊 **Dashboard**

  * Displays logged-in user details such as role and organisation

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

| Role      | Access Level                          |
| --------- | ------------------------------------- |
| Admin     | Full access to users and documents    |
| Auditor   | Read-only access across organisations |
| Bank      | Access limited to own organisation    |
| Corporate | Access limited to own organisation    |

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
│   └── README.md
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

⚠️ The `.env` file is **not committed** to GitHub for security reasons.
This value is only an example for local development.

---

## 🧪 Sample Document Data

```json
{
  "title": "Invoice for Textile Export",
  "description": "Commercial invoice for cotton textile export",
  "doc_type": "Invoice",
  "doc_number": "INV-2025-001",
  "file_url": "https://example.com/invoice.pdf",
  "hash": "a94a8fe5ccb19ba61c4c0873d391e987"
}
```

---

## 👥 Project Team

This project was developed as a **group project** under the **Infosys Springboard Virtual Internship 6.0**.

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

* File upload with automatic hash generation
* Refresh token implementation
* Organisation-wise analytics dashboard
* Audit logs for document access
* Blockchain integration for immutable document storage

---

## 🏁 Conclusion

The **Trade Finance Blockchain Explorer** demonstrates a **secure, scalable, and role-based document management system** that aligns with real-world enterprise trade finance requirements and industry best practices.

---

