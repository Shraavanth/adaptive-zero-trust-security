import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="adaptive-zero-trust-tests-") as temp_dir:
        database_path = Path(temp_dir) / "tests.sqlite3"
        settings.DATABASE_PATH = database_path
        settings.DATABASE_URL = f"sqlite:///{database_path.as_posix()}"

        from app.database.session import engine, init_db

        init_db()
        try:
            import pytest

            return pytest.main(["-v", str(BACKEND_DIR / "tests")])
        finally:
            engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
