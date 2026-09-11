"""
Database connection setup for Meri Virasat.
Uses SQLite for zero-config local/hackathon development.
"""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

from config import DATABASE_URL

# check_same_thread=False is needed only for SQLite
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_startup_migrations() -> None:
    """Add columns that `Base.metadata.create_all` can't add to an already
    -existing table (e.g. heritage_records.owner_id, introduced after the
    first version of this table shipped). Fine for SQLite/hackathon use —
    swap for Alembic migrations if this needs to run against other DBs."""
    inspector = inspect(engine)
    if "heritage_records" not in inspector.get_table_names():
        return  # fresh DB — create_all already created it with every column

    existing_columns = {col["name"] for col in inspector.get_columns("heritage_records")}
    if "owner_id" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE heritage_records ADD COLUMN owner_id VARCHAR"))

    if "users" not in inspector.get_table_names():
        return

    existing_user_columns = {col["name"] for col in inspector.get_columns("users")}
    user_columns_to_add = {
        "craft_category": "VARCHAR",
        "years_experience": "VARCHAR",
        "about_craft": "TEXT",
        "craft_photo_urls": "JSON",
    }
    with engine.begin() as connection:
        for column_name, column_type in user_columns_to_add.items():
            if column_name not in existing_user_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
