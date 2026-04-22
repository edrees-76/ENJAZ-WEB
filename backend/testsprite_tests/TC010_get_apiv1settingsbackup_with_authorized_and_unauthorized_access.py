import requests
import time

BASE_URL = "http://localhost:5144"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
USERS_URL = f"{BASE_URL}/api/v1/users"
BACKUP_URL = f"{BASE_URL}/api/v1/settings/backup"
TIMEOUT = 30


def test_get_settings_backup_with_authorized_and_unauthorized_access():
    # Login as admin
    admin_login_payload = {
        "username": "admin",
        "password": "Edrees1222004"
    }
    resp = requests.post(LOGIN_URL, json=admin_login_payload, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    tokens = resp.json()
    access_token_admin = tokens.get("accessToken")
    refresh_token_admin = tokens.get("refreshToken")
    assert access_token_admin, "Admin accessToken missing"
    assert refresh_token_admin, "Admin refreshToken missing"

    # Create limited user with role=1
    unique_username = f"testuser_{int(time.time())}"
    user_payload = {
        "username": unique_username,
        "password": "Password123!",
        "fullName": "Test User",
        "role": 1
    }
    headers_admin = {"Authorization": f"Bearer {access_token_admin}"}
    resp_create_user = requests.post(USERS_URL, json=user_payload, headers=headers_admin, timeout=TIMEOUT)
    assert resp_create_user.status_code == 201, f"User creation failed: {resp_create_user.text}"
    created_user = resp_create_user.json()
    created_username = created_user.get("username")
    assert created_username == unique_username, "Created username mismatch"

    # Login as limited user
    limited_login_payload = {
        "username": unique_username,
        "password": "Password123!"
    }
    resp_limited_login = requests.post(LOGIN_URL, json=limited_login_payload, timeout=TIMEOUT)
    assert resp_limited_login.status_code == 200, f"Limited user login failed: {resp_limited_login.text}"
    limited_tokens = resp_limited_login.json()
    access_token_limited = limited_tokens.get("accessToken")
    refresh_token_limited = limited_tokens.get("refreshToken")
    assert access_token_limited, "Limited user accessToken missing"
    assert refresh_token_limited, "Limited user refreshToken missing"

    try:
        # Access backup with admin token (should succeed)
        headers_admin_backup = {"Authorization": f"Bearer {access_token_admin}"}
        resp_backup_admin = requests.get(BACKUP_URL, headers=headers_admin_backup, timeout=TIMEOUT)
        assert resp_backup_admin.status_code == 200, f"Admin access to backup failed: {resp_backup_admin.status_code}"
        content_type = resp_backup_admin.headers.get("Content-Type", "")
        # Backup is a file content (likely JSON or encrypted), so content-type should be present
        assert content_type != "", "Backup response missing Content-Type header"
        content = resp_backup_admin.content
        assert content and len(content) > 0, "Backup content is empty"

        # Access backup with limited user token (should be forbidden)
        headers_limited_backup = {"Authorization": f"Bearer {access_token_limited}"}
        resp_backup_limited = requests.get(BACKUP_URL, headers=headers_limited_backup, timeout=TIMEOUT)
        assert resp_backup_limited.status_code == 403, f"Limited user should not access backup, got {resp_backup_limited.status_code}"

    finally:
        # Cleanup: delete the created limited user
        # To delete user, need to find user id first from GET /api/v1/users
        resp_users = requests.get(USERS_URL, headers=headers_admin, timeout=TIMEOUT)
        if resp_users.status_code == 200:
            users = resp_users.json()
            user_to_delete = next((u for u in users if u.get("username") == unique_username), None)
            if user_to_delete:
                user_id = user_to_delete.get("id")
                if user_id:
                    delete_url = f"{USERS_URL}/{user_id}"
                    requests.delete(delete_url, headers=headers_admin, timeout=TIMEOUT)


test_get_settings_backup_with_authorized_and_unauthorized_access()