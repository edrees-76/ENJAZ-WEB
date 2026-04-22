import requests

BASE_URL = "http://localhost:5144"
LOGIN_ENDPOINT = "/api/v1/auth/login"
REFRESH_ENDPOINT = "/api/v1/auth/refresh"
TIMEOUT = 30

def test_post_apiv1authrefresh_with_valid_and_invalid_tokens():
    login_payload = {
        "username": "admin",
        "password": "Edrees1222004"
    }
    try:
        # Step 1: Login to get valid tokens
        login_response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        assert "accessToken" in login_data, "accessToken missing in login response"
        assert "refreshToken" in login_data, "refreshToken missing in login response"
        access_token = login_data["accessToken"]
        refresh_token = login_data["refreshToken"]

        # Step 2: Use valid tokens to refresh
        refresh_payload = {
            "token": access_token,
            "refreshToken": refresh_token
        }
        refresh_cookies = {
            "refreshToken": refresh_token
        }
        refresh_response = requests.post(
            BASE_URL + REFRESH_ENDPOINT,
            json=refresh_payload,
            cookies=refresh_cookies,
            timeout=TIMEOUT
        )
        assert refresh_response.status_code == 200, f"Refresh with valid tokens failed with status {refresh_response.status_code}"
        refresh_data = refresh_response.json()
        assert "accessToken" in refresh_data, "accessToken missing in refresh response"
        assert "refreshToken" in refresh_data, "refreshToken missing in refresh response"
        # Validate that tokens are strings and not empty
        assert isinstance(refresh_data["accessToken"], str) and refresh_data["accessToken"], "Invalid accessToken"
        assert isinstance(refresh_data["refreshToken"], str) and refresh_data["refreshToken"], "Invalid refreshToken"

        # Step 3: Attempt refresh with invalid refresh token in cookie
        invalid_refresh_payload = {
            "token": access_token,
            "refreshToken": "invalid_refresh_token_value"
        }
        invalid_refresh_cookies = {
            "refreshToken": "invalid_refresh_token_value"
        }
        invalid_response = requests.post(
            BASE_URL + REFRESH_ENDPOINT,
            json=invalid_refresh_payload,
            cookies=invalid_refresh_cookies,
            timeout=TIMEOUT
        )
        assert invalid_response.status_code == 401, f"Expected 401 for invalid refresh token, got {invalid_response.status_code}"

        # Step 4: Attempt refresh with revoked refresh token (simulate by reusing old refresh token after logout)
        # Since no logout endpoint is specified, simulate by using the refresh token obtained but altered
        revoked_refresh_payload = {
            "token": access_token,
            "refreshToken": refresh_token + "revoked"
        }
        revoked_refresh_cookies = {
            "refreshToken": refresh_token + "revoked"
        }
        revoked_response = requests.post(
            BASE_URL + REFRESH_ENDPOINT,
            json=revoked_refresh_payload,
            cookies=revoked_refresh_cookies,
            timeout=TIMEOUT
        )
        assert revoked_response.status_code == 401, f"Expected 401 for revoked refresh token, got {revoked_response.status_code}"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_post_apiv1authrefresh_with_valid_and_invalid_tokens()