import requests

BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
SAMPLES_URL = f"{BASE_URL}/api/v1/samples"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Edrees1222004"
TIMEOUT = 30

def test_post_apiv1samples_with_valid_and_invalid_data():
    # Step 1: Authenticate as admin to get access token
    login_payload = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    try:
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        access_token = login_data.get("accessToken")
        assert access_token, "accessToken not in login response"
    except Exception as e:
        raise AssertionError(f"Failed to login and retrieve access token: {e}")

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    # Step 2: POST with valid data - should return 201
    valid_payload = {
        "analysisRequestNumber": "AR123456",
        "sender": "Test Sender",
        "samples": [
            {
                "sampleNumber": "S001",
                "description": "Test sample 1",
                "root": "soil"
            },
            {
                "sampleNumber": "S002",
                "description": "Test sample 2",
                "root": "water"
            }
        ]
    }
    created_sample_id = None
    try:
        resp_valid = requests.post(SAMPLES_URL, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert resp_valid.status_code == 201, f"Expected 201 Created for valid data, got {resp_valid.status_code}, response: {resp_valid.text}"
        resp_json = resp_valid.json()
        # Validate response contains expected keys (at least analysisRequestNumber and samples)
        assert "analysisRequestNumber" in resp_json and resp_json["analysisRequestNumber"] == valid_payload["analysisRequestNumber"]
        assert "samples" in resp_json and isinstance(resp_json["samples"], list)
        created_sample_id = resp_json.get("id")  # id might be present to reference for cleanup
    except Exception as e:
        raise AssertionError(f"POST with valid data failed: {e}")

    # Step 3: POST with invalid data (missing analysisRequestNumber) - should return 400
    invalid_payload = {
        # "analysisRequestNumber": missing
        "sender": "Test Sender",
        "samples": [
            {
                "sampleNumber": "S003",
                "description": "Invalid sample",
                "root": "soil"
            }
        ]
    }
    try:
        resp_invalid = requests.post(SAMPLES_URL, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert resp_invalid.status_code == 400, f"Expected 400 Validation Error for missing analysisRequestNumber, got {resp_invalid.status_code}, response: {resp_invalid.text}"
    except Exception as e:
        raise AssertionError(f"POST with invalid data did not return 400 as expected: {e}")

    # Cleanup: Delete the created sample reception if possible
    if created_sample_id:
        delete_url = f"{SAMPLES_URL}/{created_sample_id}"
        try:
            resp_del = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
            # Accept 204 No Content or 200 OK or 202 Accepted as successful deletes, or 404 if already removed
            assert resp_del.status_code in (204, 200, 202, 404)
        except Exception:
            pass  # Ignore cleanup failures

test_post_apiv1samples_with_valid_and_invalid_data()