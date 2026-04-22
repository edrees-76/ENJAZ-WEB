import requests

BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
SAMPLES_URL = f"{BASE_URL}/api/v1/samples"
CERTIFICATES_URL = f"{BASE_URL}/api/v1/certificates"
TIMEOUT = 30

USERNAME = "admin"
PASSWORD = "Edrees1222004"


def test_post_apiv1certificates_with_valid_and_invalid_sample_reception_id():
    # Authenticate and get access token
    login_payload = {"username": USERNAME, "password": PASSWORD}
    login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    access_token = tokens.get("access_token")
    assert access_token, "No access_token in login response"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Step 1: Create a valid sample reception to get valid sampleReceptionId
    sample_reception_payload = {
        "sampleReception": "Test Reception",
        "analysisRequestNumber": "AR-123456",
        "sender": "Test Sender",
        "samples": [
            {
                "sampleNumber": "S001",
                "description": "Test Sample 1",
                "root": "1"
            }
        ],
    }
    sample_resp = requests.post(SAMPLES_URL, json=sample_reception_payload, headers=headers, timeout=TIMEOUT)
    assert sample_resp.status_code == 201, f"Failed to create sample reception: {sample_resp.text}"
    sample_data = sample_resp.json()
    sample_reception_id = sample_data.get("id")
    assert isinstance(sample_reception_id, int), "Invalid sampleReceptionId from sample creation response"

    try:
        # Step 2: Test valid certificate creation
        certificate_payload = {
            "sampleReceptionId": sample_reception_id,
            "certificateType": "Standard"
        }

        cert_resp = requests.post(CERTIFICATES_URL, json=certificate_payload, headers=headers, timeout=TIMEOUT)
        assert cert_resp.status_code == 201, f"Valid certificate creation failed: {cert_resp.text}"
        cert_json = cert_resp.json()
        assert "id" in cert_json, "Certificate response missing id"
        assert cert_json.get("sampleReceptionId") == sample_reception_id

        # Step 3: Test invalid sampleReceptionId - 400 or 404 expected
        for invalid_id in [-1, 0, 999999999]:
            invalid_payload = certificate_payload.copy()
            invalid_payload["sampleReceptionId"] = invalid_id
            invalid_resp = requests.post(CERTIFICATES_URL, json=invalid_payload, headers=headers, timeout=TIMEOUT)
            assert invalid_resp.status_code in (400, 404), f"Expected 400 or 404 for invalid sampleReceptionId={invalid_id}, got {invalid_resp.status_code}"

    finally:
        # Cleanup skipped
        pass


test_post_apiv1certificates_with_valid_and_invalid_sample_reception_id()
