import requests

BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
SETTINGS_SYSTEM_URL = f"{BASE_URL}/api/v1/settings/system"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Edrees1222004"


def test_get_apiv1settingssystem_with_and_without_authorization():
    # Step 1: Login to get access token
    login_payload = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    try:
        login_response = requests.post(
            LOGIN_URL,
            json=login_payload,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
    login_data = login_response.json()
    assert "accessToken" in login_data and login_data["accessToken"], "accessToken missing in login response"
    access_token = login_data["accessToken"]

    headers_with_auth = {
        "Authorization": f"Bearer {access_token}"
    }

    # Step 2: Access /api/v1/settings/system WITH Authorization header - expect 200 and valid SystemSettings
    try:
        auth_response = requests.get(
            SETTINGS_SYSTEM_URL,
            headers=headers_with_auth,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Authorized GET /api/v1/settings/system request failed: {e}"

    assert auth_response.status_code == 200, f"Authorized request expected 200, got {auth_response.status_code}"

    # Basic validation that response JSON contains SystemSettings keys (as per system settings meaning assume keys)
    try:
        system_settings = auth_response.json()
    except ValueError:
        assert False, "Authorized response is not a valid JSON"

    assert isinstance(system_settings, dict) and len(system_settings) > 0, "SystemSettings response should be a non-empty JSON object"

    # Step 3: Access /api/v1/settings/system WITHOUT Authorization header - expect 401
    try:
        no_auth_response = requests.get(
            SETTINGS_SYSTEM_URL,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Unauthorized GET /api/v1/settings/system request failed: {e}"

    assert no_auth_response.status_code == 401, (
        f"Unauthorized request expected 401, got {no_auth_response.status_code}"
    )


test_get_apiv1settingssystem_with_and_without_authorization()