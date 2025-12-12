# Trade Finance Platform

A full-stack application for managing trade finance documents with user authentication and role-based access control.

## Project Structure

```
Trade Finance/
├── Backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── database.py     # Database configuration
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schema.py       # Pydantic schemas
│   │   ├── routers.py      # API routes
│   │   ├── document_routes.py
│   │   └── auth/
│   │       ├── jwt_handler.py
│   │       ├── routes.py
│   │       └── dependencies.py
│   └── requirements.txt
│
└── frontend/               # React + Vite frontend
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── pages/         # Page components
    │   ├── components/    # Reusable components
    │   └── api/           # API calls
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Features

- **User Authentication** - JWT-based login & registration
- **Role-Based Access Control** - Bank, Corporate, Auditor, Admin roles
- **Document Management** - Upload & manage trade finance documents
  - LOC (Letter of Credit)
  - Invoice
  - Bill of Lading
  - PO (Purchase Order)
  - COO (Certificate of Origin)
  - Insurance Certificate
- **Secure Password Hashing** - bcrypt password encryption
- **Token Management** - Access & refresh tokens

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt
- **Validation**: Pydantic

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Linting**: ESLint

## Installation

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate      # Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```
SECRET_KEY=your_generated_secret_key_here
DATABASE_URL=postgresql://user:password@localhost/trade_finance
```

5. Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

6. Run migrations (if using Alembic):
```bash
alembic upgrade head
```

7. Start the server:
```bash
python -m uvicorn app.main:app --reload
```

Server runs on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
VITE_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token

### Documents
- `GET /documents/` - Get all documents
- `POST /documents/` - Upload document
- `GET /documents/{id}` - Get document by ID
- `DELETE /documents/{id}` - Delete document

### Users (Admin only)
- `GET /users/` - Get all users
- `GET /users/{id}` - Get user by ID

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost/trade_finance
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=1
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## Git Workflow

Push to `groupA` branch:
```bash
git add .
git commit -m "Your message"
git push -u origin groupA
```

## Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/feature-name`
4. Create a Pull Request

## License

This project is proprietary and confidential.

## Contact

For questions, contact the development team.