"""
Database connection setup for Meri Virasat.
Supports SQLite locally and PostgreSQL on Render.
"""

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

from config import DATABASE_URL


# SQLite needs check_same_thread=False.
# PostgreSQL does not use this SQLite argument.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def run_startup_migrations() -> None:
    """Add columns to existing tables when required."""

    inspector = inspect(engine)

    if "heritage_records" not in inspector.get_table_names():
        return

    existing_columns = {
        col["name"]
        for col in inspector.get_columns("heritage_records")
    }

    if "owner_id" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE heritage_records "
                    "ADD COLUMN owner_id VARCHAR"
                )
            )

    if "users" not in inspector.get_table_names():
        return

    existing_user_columns = {
        col["name"]
        for col in inspector.get_columns("users")
    }

    user_columns_to_add = {
        "craft_category": "VARCHAR",
        "years_experience": "VARCHAR",
        "about_craft": "TEXT",
        "craft_photo_urls": "JSON",
    }

    with engine.begin() as connection:
        for column_name, column_type in user_columns_to_add.items():
            if column_name not in existing_user_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE users "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )


def get_db():
    """FastAPI dependency that yields a DB session."""

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
