import requests
import time

BASE_URL = "http://localhost:5144"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Edrees1222004"
TIMEOUT = 30

def test_post_apiv1users_with_valid_and_invalid_data():
    # Step 1: Login as admin to get access token
    login_url = f"{BASE_URL}/api/v1/auth/login"
    login_payload = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    try:
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Admin login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        access_token = login_data.get("access_token")
        assert access_token, "No access_token received on admin login"
    except requests.RequestException as e:
        assert False, f"Admin login request failed: {e}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    created_user_id = None
    try:
        # Step 2: POST with valid data (strong password and role=1)
        post_url = f"{BASE_URL}/api/v1/users"
        unique_username = f"testuser_tc004_{int(time.time() * 1000)}"
        valid_user_payload = {
            "username": unique_username,
            "password": "StrongPass123!",
            "fullName": "Test User TC004",
            "role": 1
        }
        post_resp = requests.post(post_url, headers=headers, json=valid_user_payload, timeout=TIMEOUT)
        assert post_resp.status_code == 201, f"Expected 201 Created, got {post_resp.status_code}"
        user_data = post_resp.json()
        # Validate UserDto fields
        assert isinstance(user_data, dict), "Response is not a JSON object"
        created_user_id = user_data.get("id")
        assert created_user_id, "User ID missing in response"
        assert user_data.get("username") == valid_user_payload["username"], "Username mismatch in response"
        assert user_data.get("fullName") == valid_user_payload["fullName"], "fullName mismatch in response"
        assert int(user_data.get("role")) == valid_user_payload["role"], "Role mismatch in response"

        # Step 3: POST with invalid data (missing username and password) to cause validation error 400
        invalid_user_payload = {
            "fullName": "Invalid User",
            "role": 1
        }
        invalid_resp = requests.post(post_url, headers=headers, json=invalid_user_payload, timeout=TIMEOUT)
        assert invalid_resp.status_code == 400, f"Expected 400 Validation error, got {invalid_resp.status_code}"

    finally:
        # Step 4: Cleanup by deleting the created user if exists
        if created_user_id:
            try:
                delete_url = f"{BASE_URL}/api/v1/users/{created_user_id}"
                delete_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                # Some APIs return 204 No Content or 200 OK on delete success
                assert delete_resp.status_code in (200, 204), f"Failed to delete user id {created_user_id}, status {delete_resp.status_code}"
            except requests.RequestException as e:
                assert False, f"Exception during cleanup delete: {e}"

test_post_apiv1users_with_valid_and_invalid_data()
