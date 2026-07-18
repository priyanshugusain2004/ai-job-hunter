from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core import security

def test_register_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies

def test_register_existing_user(client: TestClient, db: Session):
    # Pre-create a user
    user = User(
        email="test@example.com",
        password_hash=security.get_password_hash("password"),
        full_name="Existing User"
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client: TestClient, db: Session):
    # Pre-create a user
    user = User(
        email="test@example.com",
        password_hash=security.get_password_hash("securepassword"),
        full_name="Test User"
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies

def test_login_wrong_password(client: TestClient, db: Session):
    # Pre-create a user
    user = User(
        email="test@example.com",
        password_hash=security.get_password_hash("securepassword"),
        full_name="Test User"
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert "Incorrect email or password" in response.json()["detail"]

def test_refresh_token(client: TestClient, db: Session):
    # Register first to get cookie
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    assert response.status_code == 201
    
    # Request refresh endpoint
    refresh_response = client.post("/api/v1/auth/refresh")
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data
    assert "refresh_token" in refresh_response.cookies

def test_get_profile(client: TestClient, db: Session):
    # Pre-create a user
    user = User(
        email="test@example.com",
        password_hash=security.get_password_hash("securepassword"),
        full_name="Test User"
    )
    db.add(user)
    db.commit()

    # Login to get access token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    token = login_response.json()["access_token"]

    # Fetch profile
    headers = {"Authorization": f"Bearer {token}"}
    profile_response = client.get("/api/v1/profile/me", headers=headers)
    assert profile_response.status_code == 200
    data = profile_response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"

def test_update_profile(client: TestClient, db: Session):
    # Pre-create a user
    user = User(
        email="test@example.com",
        password_hash=security.get_password_hash("securepassword"),
        full_name="Test User"
    )
    db.add(user)
    db.commit()

    # Login to get access token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    token = login_response.json()["access_token"]

    # Update profile
    headers = {"Authorization": f"Bearer {token}"}
    update_response = client.put(
        "/api/v1/profile/me",
        headers=headers,
        json={
            "full_name": "Updated Name",
            "location": "San Francisco, CA",
            "target_role": "Senior Developer"
        }
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["full_name"] == "Updated Name"
    assert data["location"] == "San Francisco, CA"
    assert data["target_role"] == "Senior Developer"

def test_logout(client: TestClient):
    # Set a dummy cookie
    client.cookies.set("refresh_token", "dummy", path="/api/v1/auth")
    
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"message": "Successfully logged out"}
    
    # Verify cookie is cleared (its value should be empty or deleted)
    cookie = response.cookies.get("refresh_token")
    assert cookie is None or cookie == ""
