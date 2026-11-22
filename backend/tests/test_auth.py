from fastapi.testclient import TestClient

def test_login_admin(client: TestClient):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["username"] == "admin"

def test_login_resident(client: TestClient):
    response = client.post("/api/auth/login", json={
        "username": "resident",
        "password": "resident123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "resident"

def test_login_invalid_password(client: TestClient):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_register_new_resident(client: TestClient):
    response = client.post("/api/auth/register", json={
        "username": "newresident",
        "email": "newresident@test.com",
        "password": "pass12345",
        "full_name": "Test Resident",
        "role": "resident"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newresident"
    assert data["role"] == "resident"
