import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import get_db, Base, engine

# Create TestingSessionLocal
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Connect to the database
    connection = engine.connect()
    # Begin a transaction
    transaction = connection.begin()
    # Create a new session for the test
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    # Close the session and rollback the transaction to keep DB clean
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
