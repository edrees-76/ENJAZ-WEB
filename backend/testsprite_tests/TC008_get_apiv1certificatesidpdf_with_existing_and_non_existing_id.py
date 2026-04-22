import requests
import time

BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
SAMPLES_URL = f"{BASE_URL}/api/v1/samples"
CERTIFICATES_URL = f"{BASE_URL}/api/v1/certificates"

def test_get_certificate_pdf_existing_and_non_existing():
    timeout = 30
    admin_username = "admin"
    admin_password = "Edrees1222004"

    # Authenticate and get tokens
    login_payload = {"username": admin_username, "password": admin_password}
    login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=timeout)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
    tokens = login_resp.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    assert access_token is not None and refresh_token is not None, "Tokens missing in login response"

    headers = {"Authorization": f"Bearer {access_token}"}

    # Prepare sample reception data
    timestamp_str = str(int(time.time()))
    sample_reception_payload = {
        "analysisRequestNumber": f"AR{timestamp_str}",
        "sender": "Test Sender",
        "samples": [
            {"sampleNumber": "S001", "description": "Test sample 1", "root": "soil"},
            {"sampleNumber": "S002", "description": "Test sample 2", "root": "soil"}
        ]
    }

    # Create sample reception
    sample_reception_resp = requests.post(SAMPLES_URL, json=sample_reception_payload, headers=headers, timeout=timeout)
    assert sample_reception_resp.status_code == 201, f"Sample reception creation failed: {sample_reception_resp.status_code}"
    sample_reception = sample_reception_resp.json()
    sample_reception_id = sample_reception.get("id")
    assert sample_reception_id is not None, "id missing in sample creation response"
    sample_reception_id = int(sample_reception_id)

    certificate_id = None
    try:
        # Issue certificate for created sample reception
        certificate_payload = {
            "sampleReceptionId": sample_reception_id,
            "certificateType": "Standard"
        }
        certificate_resp = requests.post(CERTIFICATES_URL, json=certificate_payload, headers=headers, timeout=timeout)
        assert certificate_resp.status_code == 201, f"Certificate issuance failed: {certificate_resp.status_code}"
        certificate = certificate_resp.json()
        certificate_id = certificate.get("id")
        assert certificate_id is not None, "Certificate id missing in issuance response"

        # Test GET PDF with existing certificate id - expect 200 and PDF content-type
        pdf_url = f"{CERTIFICATES_URL}/{certificate_id}/pdf"
        pdf_resp = requests.get(pdf_url, headers=headers, timeout=timeout)
        assert pdf_resp.status_code == 200, f"GET certificate PDF failed with status {pdf_resp.status_code}"
        content_type = pdf_resp.headers.get("Content-Type", "")
        # Accept standard PDF content types
        assert "application/pdf" in content_type.lower(), f"Expected PDF content type, got {content_type}"
        assert len(pdf_resp.content) > 0, "PDF content is empty"

        # Test GET PDF with non-existent certificate id - expect 404
        non_existent_id = 9999999999
        pdf_url_non_exist = f"{CERTIFICATES_URL}/{non_existent_id}/pdf"
        pdf_resp_non_exist = requests.get(pdf_url_non_exist, headers=headers, timeout=timeout)
        assert pdf_resp_non_exist.status_code == 404, f"Expected 404 for non-existent certificate id, got {pdf_resp_non_exist.status_code}"

    finally:
        # Cleanup: delete created certificate and sample reception if API supports deletion
        # The PRD does not show delete endpoints; skipping cleanup for certificate and sample reception
        # If needed, implement deletion here when API is available
        pass

test_get_certificate_pdf_existing_and_non_existing()
