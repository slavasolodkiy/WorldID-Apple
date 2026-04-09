# World App Core Contracts

**Status**: Temporary canonical reference — this repo (Apple/web) is the source of truth for auth, verification, and transaction logic. Android should converge to these contracts.

---

## 1. Auth & Session Model

### Mechanism
- Server-side sessions stored in PostgreSQL via `connect-pg-simple`.
- Session cookie: `world.sid` — `HttpOnly`, `SameSite=Lax`, `Secure` in production, 30-day expiry.
- Session store table: `session` (auto-created by `createTableIfMissing: true`).

### Session shape
```typescript
req.session.userId: string  // internal user ID (e.g. "user_abc123")
```

### Routes (all under `/api`)
| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| POST | `/auth/login` | No | Look up user by username, regenerate session, set userId |
| POST | `/auth/logout` | No | Destroy session, clear cookie |
| GET | `/auth/me` | No | Return current session user; destroys ghost sessions |

### Invariants
1. **Session fixation prevention**: `session.regenerate()` is called on every successful login. The old session ID is discarded before `userId` is written.
2. **Ghost session cleanup**: If `/auth/me` finds a session `userId` that no longer exists in the DB, the session is destroyed and `userId: null` is returned.
3. **No auto-login**: The frontend calls `/auth/me` on load. If `userId` is null the user is directed to `/login`. No username is hardcoded or assumed.
4. **Username-only auth**: There is no password in this reference implementation — the login model is simplified for prototyping. Production deployments must add credential verification (password hash or OAuth).

### Protected route boundary
All routes registered after `router.use(requireAuth)` in `routes/index.ts` require an active session. The middleware returns `401 { error: "Authentication required" }` when `req.session.userId` is absent.

Exposed without auth: `GET /health`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.

---

## 2. Verification Lifecycle

### State machine
```
[none] → pending → processing → complete
                ↘ (expired/invalid) → rejected at API layer
```

States are stored in `verification_sessions.status`. Transitions are enforced in `routes/verification.ts`:

| From | To | Condition |
|------|----|-----------|
| — | `pending` | `POST /verification/initiate` (any authenticated user) |
| `pending` | `processing` | First write inside the DB transaction on complete |
| `processing` | `complete` | All writes succeed atomically |
| `pending` | (rejected) | Session expired or wrong user calls complete |
| non-`pending` | (rejected) | Attempt to complete an already-processing/complete session |

### Completion requirements
`POST /verification/complete` requires all three:
- `sessionId` — must exist in DB
- `sessionId.userId` must equal `req.session.userId` (ownership enforced)
- `proof` — non-empty string; represents the ZKP from the Orb device

### Nullifier hash derivation
```
nullifierHash = SHA-256( sessionId + ":" + proof )
```
Never synthesized from missing inputs. If proof is absent the request is rejected with `400`.

### Atomic write sequence (single DB transaction)
1. `verification_sessions` → status `processing`
2. Upsert `verifications` (insert or update by `userId`)
3. `users` → `verificationLevel = "orb"`, `isVerified = true`
4. `verification_sessions` → status `complete`

### Session TTL
Verification sessions expire 10 minutes after initiation. Verifications themselves expire 1 year after completion.

---

## 3. Transaction Invariants

### Debit path (POST /transactions)
1. **Idempotency check first**: If `Idempotency-Key` header is present, look up by `(userId, idempotencyKey)`. Return the existing record with `200` if found — no second debit ever occurs.
2. **Row lock**: `SELECT … FOR UPDATE` on the wallet row inside a DB transaction. Concurrent requests block until the lock is released, preventing double-spend.
3. **Balance check**: Inside the lock, compare `currentBalance >= amountNum`. Reject with `422 { error: "Insufficient … balance" }` if not enough.
4. **Atomic debit + insert**: Update `wallets.{token}Balance` and insert into `transactions` in the same DB transaction. Either both succeed or neither does.

### Supported tokens
`WLD`, `USDC`, `ETH` — all others return `400 { error: "Unsupported token: …" }`.

### Amount rules
- Must be parseable as a positive finite number.
- Zero or negative amounts → `400 { error: "Amount must be a positive number" }`.
- Stored as a fixed-decimal string in the DB to avoid floating-point drift.

### Error response shape (deterministic for retries)
| Condition | HTTP | Body |
|-----------|------|------|
| Validation failure | 400 | `{ error: "<zod message>" }` |
| Unsupported token | 400 | `{ error: "Unsupported token: X" }` |
| Non-positive amount | 400 | `{ error: "Amount must be a positive number" }` |
| Insufficient balance | 422 | `{ error: "Insufficient X balance" }` |
| Duplicate idempotency key | 200 | Original transaction object |
| Success | 201 | New transaction object |

### Idempotency key scope
Scoped to `(userId, idempotencyKey)`. The same key used by two different users creates two independent transactions.

---

## 4. API & Error Conventions

- All routes are prefixed `/api`.
- Request/response schemas are defined in `lib/api-spec/openapi.yaml` and code-generated into `lib/api-zod` (Zod schemas) and `lib/api-client-react` (React Query hooks).
- Errors always return `{ error: string }`. Never an empty body on failure.
- Numeric balance fields are stored as `numeric` in Postgres and coerced to `number` in responses via `parseFloat`.
- Dates are always ISO 8601 strings in responses.

---

## 5. Stats Semantics

- `grantsClaimed` and `unreadNotifications` are **user-scoped** (filtered by `req.session.userId`).
- `verifiedUsers` is **global** (count of all users with `isVerified = true`) — this is intentional product context.
- Token prices (`/stats/token-prices`) are simulated with deterministic random walks and do not reflect real market data.

---

## 6. Database Migration Strategy

Migrations are managed with Drizzle Kit:
- Schema source: `lib/db/src/schema/`
- Migration output: `lib/db/migrations/`
- Scripts: `pnpm --filter @workspace/db run generate` (create SQL) / `pnpm --filter @workspace/db run migrate` (apply)
- CI uses `pnpm --filter @workspace/db run push` for speed; production deployments should use `migrate`.

---

## 7. Android Convergence Notes

This web/Express reference implementation defines the canonical contract. When porting to Android:

1. **Auth**: Replace username-only login with proper credential verification. Session model maps 1:1 to any server-side session mechanism (JWT, cookie-based, etc.) — the key invariants are session fixation prevention and ghost session cleanup.
2. **Verification**: The state machine transitions and the `sha256(sessionId:proof)` nullifier derivation are the portable primitives. The actual `proof` value will come from the World ID Android SDK.
3. **Transactions**: The idempotency + SELECT FOR UPDATE pattern is backend-only; the Android client should send `Idempotency-Key` headers and handle `200` (duplicate) vs `201` (new) responses.
4. **OpenAPI spec** (`lib/api-spec/openapi.yaml`) is the single source of truth for all request/response shapes. Generate Android clients from it.
