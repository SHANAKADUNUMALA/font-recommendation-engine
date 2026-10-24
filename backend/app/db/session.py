"""
Database session and connection management.
Provides connection pooling and context manager for SQLite operations.
"""
from contextlib import contextmanager
from app.db.repository import get_db_connection

@contextmanager
def get_db_session():
    """Context manager for safe database connections."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

