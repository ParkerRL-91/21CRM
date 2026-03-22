---
title: HubSpot Authentication
tags: [#integration, #hubspot, #auth]
created: 2026-03-22
updated: 2026-03-22
---

# HubSpot Authentication

## OAuth Flow

1. User configures OAuth app credentials at `/setup` (client ID, client secret)
2. Credentials stored encrypted in `organizations` table
3. User clicks "Connect with HubSpot" → NextAuth HubSpot provider handles OAuth
4. Access + refresh tokens stored encrypted in `organizations.accessTokenEncrypted` / `refreshTokenEncrypted`
5. Token expiry tracked in `organizations.tokenExpiresAt`

## Token Refresh Pattern

Every API route that needs HubSpot access follows this pattern:

```typescript
// 1. Get org
const org = await db.query.organizations.findFirst({...});
// 2. Decrypt token
let accessToken = decrypt(org.accessTokenEncrypted);
// 3. Check expiry, refresh if needed
if (org.tokenExpiresAt <= new Date()) {
  const refreshToken = decrypt(org.refreshTokenEncrypted);
  const newTokens = await HubSpotClient.refreshToken(refreshToken);
  accessToken = newTokens.access_token;
  // 4. Persist new tokens
  await db.update(schema.organizations).set({...});
}
```

## Encryption

Tokens are encrypted using `src/lib/crypto.ts` (`encrypt()` / `decrypt()` functions). The encryption key comes from `process.env.ENCRYPTION_KEY`.

## Multi-Tenant

Each organization has its own tokens. The `withTenant()` helper resolves the current org from the session. In dev mode, it falls back to the first org in the database.

See [[hubspot-sync-engine]] for how tokens are used during sync.
