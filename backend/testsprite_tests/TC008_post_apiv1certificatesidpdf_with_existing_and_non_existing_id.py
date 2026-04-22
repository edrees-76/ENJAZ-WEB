import requests
import uuid

BASE_URL = "http://localhost:5144"
TIMEOUT = 30

def test_post_apiv1certificatesidpdf_with_existing_and_nonexisting_id():
    session = requests.Session()

    # 1. Login to get admin access token
    login_url = f"{BASE_URL}/api/v1/auth/login"
    login_payload = {
        "username": "admin",
        "password": "Edrees1222004"
    }
    try:
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "access_token" in login_data and "refresh_token" in login_data, "Tokens missing in login response"
        access_token = login_data["access_token"]

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # 2. Create a sample reception first (required for certificate creation)
        samples_url = f"{BASE_URL}/api/v1/samples"
        sample_payload = {
            "analysisRequestNumber": f"AR-{uuid.uuid4()}",
            "sender": "UnitTestSender",
            "samples": [
                {
                    "sampleNumber": "S001",
                    "description": "Test sample description",
                    "root": "soil"
                }
            ]
        }
        samples_resp = session.post(samples_url, json=sample_payload, headers=headers, timeout=TIMEOUT)
        assert samples_resp.status_code == 201, f"Create sample failed with status {samples_resp.status_code}"
        sample_data = samples_resp.json()
        sample_reception_id = sample_data.get("id")
        assert sample_reception_id is not None, "Sample reception id missing in response"

        # 3. Create a certificate using the sample reception id
        certificates_url = f"{BASE_URL}/api/v1/certificates"
        certificate_payload = {
            "sampleReceptionId": sample_reception_id,
            "certificateType": "Standard"
        }
        cert_resp = session.post(certificates_url, json=certificate_payload, headers=headers, timeout=TIMEOUT)
        assert cert_resp.status_code == 201, f"Create certificate failed with status {cert_resp.status_code}"
        cert_data = cert_resp.json()
        certificate_id = cert_data.get("id")
        assert certificate_id is not None, "Certificate id missing in response"

        # 4. GET to /api/v1/certificates/{id}/pdf for existing certificate id
        pdf_url_existing = f"{BASE_URL}/api/v1/certificates/{certificate_id}/pdf"
        pdf_resp_existing = session.get(pdf_url_existing, headers=headers, timeout=TIMEOUT)
        assert pdf_resp_existing.status_code == 200, f"PDF generation for existing certificate id failed with status {pdf_resp_existing.status_code}"
        # Verify that the content seems like a PDF (basic check for %PDF header)
        assert pdf_resp_existing.content[:4] == b"%PDF", "Returned content is not a PDF for existing certificate"

        # 5. GET to /api/v1/certificates/{id}/pdf for non-existent certificate id
        non_existing_id = 99999999  # An arbitrarily large id unlikely to exist
        pdf_url_non_existing = f"{BASE_URL}/api/v1/certificates/{non_existing_id}/pdf"
        pdf_resp_non_existing = session.get(pdf_url_non_existing, headers=headers, timeout=TIMEOUT)
        assert pdf_resp_non_existing.status_code == 404, f"Expected 404 for non-existent certificate id but got {pdf_resp_non_existing.status_code}"

    finally:
        # Cleanup: delete created certificate
        if 'certificate_id' in locals():
            try:
                del_cert_url = f"{BASE_URL}/api/v1/certificates/{certificate_id}"
                session.delete(del_cert_url, headers=headers, timeout=TIMEOUT)
            except Exception:
                pass

        # Cleanup: delete created sample reception
        if 'sample_reception_id' in locals():
            try:
                del_sample_url = f"{BASE_URL}/api/v1/samples/{sample_reception_id}"
                session.delete(del_sample_url, headers=headers, timeout=TIMEOUT)
            except Exception:
                pass

test_post_apiv1certificatesidpdf_with_existing_and_nonexisting_id()
