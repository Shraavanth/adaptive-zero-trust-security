# Setup & Installation Guide

## Prerequisites

1. **Python**: 3.11+
2. **Node.js**: v18+ with `npm`
3. **Capture Tools (optional; Windows)**:
   - **Wireshark / TShark**: Recommended for high-speed packet dissection (default: `C:\Program Files\Wireshark\tshark.exe`).
   - **Npcap**: Required on Windows for capturing raw hardware network adapter traffic. Installed automatically with Wireshark.

---

## 1. Backend Installation

Navigate to the `backend` folder and install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

The API has no authentication or authorization. Keep the backend bound to localhost; do not expose it to an untrusted network. The default database is `data/adaptive_zero_trust.db` and stores application data between runs. Do not run the API integration tests against that database.

Initialize the application database:

```bash
python -c "from app.main import app; from app.database.session import init_db; init_db(); print('DB Ready!')"
```

Start the FastAPI backend server:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000`.
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`.

---

## 2. Frontend Installation

Navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The web application will be accessible at `http://localhost:5173`.
All API requests (`/api/...` and `/ws/...`) are automatically proxied to the FastAPI server running on port 8000.

---

## 3. Running Automated Tests

Run the backend suite with an isolated, temporary SQLite database. The runner removes only its own temporary database after the tests finish:

```bash
cd backend
python run_tests.py
```

Build the frontend (TypeScript check and production bundle):

```bash
cd frontend
npm run build
```
