import requests

BASE_URL = "http://localhost:5144"
LOGIN_PATH = "/api/v1/auth/login"
TIMEOUT = 30

def test_post_apiv1authlogin_valid_and_invalid_credentials():
    url = BASE_URL + LOGIN_PATH
    headers = {"Content-Type": "application/json"}

    # Test valid credentials
    valid_payload = {
        "username": "admin",
        "password": "Edrees1222004"
    }
    try:
        valid_response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Valid credentials request failed: {e}"

    assert valid_response.status_code == 200, f"Expected status 200 for valid credentials, got {valid_response.status_code}"
    try:
        valid_json = valid_response.json()
    except ValueError:
        assert False, "Response for valid credentials is not valid JSON"
    assert "accessToken" in valid_json and isinstance(valid_json["accessToken"], str) and valid_json["accessToken"].strip() != "", \
        "accessToken missing or empty in valid login response"
    assert "refreshToken" in valid_json and isinstance(valid_json["refreshToken"], str) and valid_json["refreshToken"].strip() != "", \
        "refreshToken missing or empty in valid login response"

    # Test invalid credentials
    invalid_payload = {
        "username": "admin",
        "password": "WrongPassword123"
    }
    try:
        invalid_response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid credentials request failed: {e}"

    assert invalid_response.status_code == 401, f"Expected status 401 for invalid credentials, got {invalid_response.status_code}"

test_post_apiv1authlogin_valid_and_invalid_credentials()