import requests

BASE_URL = "http://localhost:5144"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Edrees1222004"
LIMITED_USER_ROLE = 1
LIMITED_USER_PASSWORD = "StrongPass123!"
TIMEOUT = 30


def test_post_apiv1settingsbackupexport_authorized_and_unauthorized_access():
    # Helper: login user and return access token (camelCase JSON keys)
    def login(username, password):
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"username": username, "password": password},
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Login failed for {username}"
        tokens = response.json()
        assert "accessToken" in tokens and "refreshToken" in tokens
        return tokens["accessToken"]

    # Helper: create a user and return userId
    def create_user(admin_token, username, password, fullName, role):
        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {
            "username": username,
            "password": password,
            "fullName": fullName,
            "role": role,
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/users", json=payload, headers=headers, timeout=TIMEOUT
        )
        assert response.status_code == 201, f"User creation failed: {response.text}"
        user = response.json()
        assert "id" in user
        return user["id"]

    # Helper: delete a user by id
    def delete_user(admin_token, user_id):
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/v1/users/{user_id}", headers=headers, timeout=TIMEOUT
        )
        # 204 No Content or 200 OK are acceptable for delete
        assert response.status_code in (200, 204)

    admin_token = login(ADMIN_USERNAME, ADMIN_PASSWORD)

    # Create limited user
    limited_username = "limited_user_test_tc010"
    limited_fullname = "Limited User TC010"
    limited_user_id = None
    limited_user_token = None

    try:
        limited_user_id = create_user(
            admin_token,
            limited_username,
            LIMITED_USER_PASSWORD,
            limited_fullname,
            LIMITED_USER_ROLE,
        )
        limited_user_token = login(limited_username, LIMITED_USER_PASSWORD)

        # Test POST /api/v1/settings/backup/export with admin token
        url = f"{BASE_URL}/api/v1/settings/backup/export"
        headers_admin = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json",
        }
        payload_admin = {"password": ADMIN_PASSWORD}
        response_admin = requests.post(
            url, json=payload_admin, headers=headers_admin, timeout=TIMEOUT
        )
        assert response_admin.status_code == 200, f"Admin export backup failed: {response_admin.text}"
        # Expect backup file content (could be JSON or encrypted content)
        assert response_admin.content, "Backup file content is empty for admin"

        # Test POST /api/v1/settings/backup/export with limited user token
        headers_limited = {
            "Authorization": f"Bearer {limited_user_token}",
            "Content-Type": "application/json",
        }
        payload_limited = {"password": ADMIN_PASSWORD}
        response_limited = requests.post(
            url, json=payload_limited, headers=headers_limited, timeout=TIMEOUT
        )
        assert response_limited.status_code == 403, (
            f"Expected 403 Forbidden for limited user but got {response_limited.status_code}"
        )

    finally:
        if limited_user_id:
            delete_user(admin_token, limited_user_id)


test_post_apiv1settingsbackupexport_authorized_and_unauthorized_access()