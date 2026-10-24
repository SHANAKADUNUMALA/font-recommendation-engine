from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import hashlib
from app.db.repository import get_db_connection

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    role_requested: str = "user" # "user" | "admin"

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user" # "user" | "admin"

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ensure_users_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Seed default accounts if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        ''', ("Lead Researcher", "admin@typographic.ai", hash_pw("admin123"), "admin"))
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        ''', ("Bilingual Designer", "designer@typographic.ai", hash_pw("designer123"), "user"))
        conn.commit()
    conn.close()

@router.post("/auth/login")
def login_user(req: LoginRequest):
    """Authenticates users and returns role-based authorization tokens."""
    ensure_users_table()
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = req.email.strip().lower()
    pw_hash = hash_pw(req.password.strip())

    cursor.execute("SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = ?", (email_clean,))
    row = cursor.fetchone()

    # Pre-seeded fast demo accounts auto-recovery if modified
    if not row:
        if email_clean == "admin@typographic.ai" and req.password in ["admin123", "admin"]:
            cursor.execute("INSERT OR REPLACE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                           ("Lead Researcher", "admin@typographic.ai", hash_pw("admin123"), "admin"))
            conn.commit()
            cursor.execute("SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = ?", (email_clean,))
            row = cursor.fetchone()
        elif email_clean in ["designer@typographic.ai", "user@typographic.ai"]:
            cursor.execute("INSERT OR REPLACE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                           ("Bilingual Designer", email_clean, hash_pw("designer123"), "user"))
            conn.commit()
            cursor.execute("SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = ?", (email_clean,))
            row = cursor.fetchone()

    conn.close()

    if not row or row[4] != pw_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password. Use demo quick-buttons or register.")

    return {
        "status": "success",
        "user": {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3]
        }
    }

@router.post("/auth/register")
def register_user(req: RegisterRequest):
    """Registers new evaluators and designers with assigned roles."""
    ensure_users_table()
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = req.email.strip().lower()
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pw_hash = hash_pw(req.password.strip())
    cursor.execute('''
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', (req.name.strip(), email_clean, pw_hash, req.role.strip().lower()))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "user": {
            "id": user_id,
            "name": req.name.strip(),
            "email": email_clean,
            "role": req.role.strip().lower()
        }
    }

@router.get("/auth/users")
def get_all_users():
    """Returns the registered users list for the Admin console."""
    ensure_users_table()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return {
        "users": [
            {
                "id": r[0],
                "name": r[1],
                "email": r[2],
                "role": r[3],
                "created_at": r[4]
            }
            for r in rows
        ]
    }


