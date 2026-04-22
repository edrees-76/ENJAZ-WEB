import requests

BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
USERS_URL = f"{BASE_URL}/api/v1/users"
TIMEOUT = 30

def test_get_users_with_and_without_authorization():
    # Step 1: Login to get the access token
    login_payload = {
        "username": "admin",
        "password": "Edrees1222004"
    }
    try:
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_data = login_response.json()
        assert "accessToken" in login_data, "'accessToken' not found in login response"
        access_token = login_data["accessToken"]
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    # Step 2: Call GET /api/v1/users with valid access token, expect 200 and list of users
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    try:
        users_response_auth = requests.get(USERS_URL, headers=headers, timeout=TIMEOUT)
        assert users_response_auth.status_code == 200, f"Authorized request failed with status code {users_response_auth.status_code}"
        users_data = users_response_auth.json()
        assert isinstance(users_data, list), "Users response is not a list"
    except requests.RequestException as e:
        assert False, f"GET /api/v1/users with authorization failed: {e}"

    # Step 3: Call GET /api/v1/users without Authorization header, expect 401 Unauthorized
    try:
        users_response_no_auth = requests.get(USERS_URL, timeout=TIMEOUT)
        assert users_response_no_auth.status_code == 401, f"Unauthorized request did not return 401 but {users_response_no_auth.status_code}"
    except requests.RequestException as e:
        assert False, f"GET /api/v1/users without authorization failed: {e}"

test_get_users_with_and_without_authorization()