# API Key Guide

API keys are the recommended authentication method for the Claude Code stop hook. They are simpler than Entra ID JWTs and work in any environment.

## How API Keys Work

- Keys start with the `wyre_ak_` prefix followed by 64 hex characters
- The API stores only a SHA-256 hash of each key -- the raw key is never persisted
- The raw key is returned exactly once at creation time. There is no way to retrieve it later.
- Each key is associated with a specific engineer. When the key is used to authenticate, the API resolves the engineer automatically.
- The `last_used_at` timestamp is updated on every successful authentication.

## Generating a Key

### Via the API

An admin creates a key for an engineer:

```bash
curl -X POST https://impact-api.wyretechnology.com/api/v1/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "engineer_id": "ab12cd34-ef56-7890-abcd-ef1234567890",
    "name": "janes-laptop"
  }'
```

**Response (201 Created):**
```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "key": "wyre_ak_a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890",
  "name": "janes-laptop",
  "key_prefix": "wyre_ak_a1b2...",
  "created_at": "2026-03-26T12:00:00Z"
}
```

Copy the `key` value immediately. It will not be shown again.

### Via the Admin Dashboard

1. Navigate to the Admin panel
2. Go to API Keys
3. Select the engineer
4. Give the key a descriptive name (e.g. "janes-macbook", "ci-pipeline")
5. Click Create
6. Copy the key from the confirmation dialog

## Using a Key

Set it as the `WYRE_IMPACT_API_KEY` environment variable. The stop hook will include it as a Bearer token automatically.

```bash
# In ~/.zshrc or ~/.bashrc
export WYRE_IMPACT_API_KEY="wyre_ak_a1b2c3d4e5f67890..."
```

Or use it directly in API calls:

```bash
curl -H "Authorization: Bearer wyre_ak_a1b2c3d4e5f67890..." \
  https://impact-api.wyretechnology.com/api/v1/sessions
```

## Listing Keys

Admins can list all keys. The response includes only the prefix, never the full key.

```bash
curl https://impact-api.wyretechnology.com/api/v1/admin/api-keys \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
[
  {
    "id": "11111111-2222-3333-4444-555555555555",
    "engineer_id": "ab12cd34-ef56-7890-abcd-ef1234567890",
    "name": "janes-laptop",
    "key_prefix": "wyre_ak_a1b2...",
    "active": true,
    "created_at": "2026-03-26T12:00:00Z",
    "last_used_at": "2026-03-26T15:30:00Z"
  }
]
```

## Revoking a Key

Revocation is immediate and permanent. The key becomes unusable but the record is kept for audit purposes.

```bash
curl -X DELETE https://impact-api.wyretechnology.com/api/v1/admin/api-keys/11111111-2222-3333-4444-555555555555 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:** `204 No Content`

If an engineer leaves or a key is compromised, revoke it and create a new one.

## Security Notes

- **Never commit API keys to source control.** Use environment variables or a secrets manager.
- **One key per device.** If an engineer uses multiple machines, create separate keys with descriptive names. This way you can revoke a single device without affecting others.
- **Rotate keys periodically.** Create a new key, update the engineer's environment, then revoke the old one.
- **Keys are scoped to one engineer.** A key cannot be reassigned. To change the engineer, revoke the old key and create a new one.
- **Admin access is required** to create, list, or revoke keys. Regular engineers cannot manage keys.
- **The raw key is shown only once.** If an engineer loses their key, an admin must revoke it and issue a replacement.
