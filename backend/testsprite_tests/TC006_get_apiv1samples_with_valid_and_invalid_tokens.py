import requests


BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
SAMPLES_URL = f"{BASE_URL}/api/v1/samples"
TIMEOUT = 30


def test_get_apiv1samples_with_valid_and_invalid_tokens():
    # Step 1: Login to get a valid access token
    login_payload = {
        "username": "admin",
        "password": "Edrees1222004"
    }
    try:
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_json = login_response.json()
        access_token = login_json.get("accessToken")
        assert access_token and isinstance(access_token, str), "accessToken not found or invalid in login response"
    except requests.RequestException as e:
        assert False, f"Exception during login request: {e}"

    # Step 2: Call GET /api/v1/samples with valid token
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        samples_response = requests.get(SAMPLES_URL, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Exception during GET /api/v1/samples with valid token: {e}"

    assert samples_response.status_code == 200, f"Expected 200 OK with valid token, got {samples_response.status_code}"
    try:
        samples_json = samples_response.json()
    except Exception as e:
        assert False, f"Response not valid JSON: {e}"

    # Validate response contains top-level keys 'items' and 'totalCount'
    assert isinstance(samples_json, dict), "Response JSON is not an object"
    assert 'items' in samples_json, "'items' key missing in response"
    assert 'totalCount' in samples_json, "'totalCount' key missing in response"

    # Validate 'items' is a list
    assert isinstance(samples_json['items'], list), "'items' is not a list"

    # Step 3: Call GET /api/v1/samples with missing token
    try:
        no_auth_response = requests.get(SAMPLES_URL, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Exception during GET /api/v1/samples without token: {e}"

    assert no_auth_response.status_code == 401, f"Expected 401 Unauthorized without token, got {no_auth_response.status_code}"

    # Step 4: Call GET /api/v1/samples with invalid/expired token
    invalid_headers = {"Authorization": "Bearer invalid_or_expired_token"}
    try:
        invalid_token_response = requests.get(SAMPLES_URL, headers=invalid_headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Exception during GET /api/v1/samples with invalid token: {e}"

    assert invalid_token_response.status_code == 401, f"Expected 401 Unauthorized with invalid token, got {invalid_token_response.status_code}"


test_get_apiv1samples_with_valid_and_invalid_tokens()