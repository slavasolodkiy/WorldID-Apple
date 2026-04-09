# Reuse Readiness Report

**Repository**: WorldID-Apple (web — React + Express + PostgreSQL)  
**Role**: Temporary canonical source of truth for auth, verification, and transaction logic  
**Date**: April 2026  
**Status**: Ready for Android convergence reference — not production-ready without credential hardening

---

## Summary

This report evaluates whether the Apple implementation is suitable as a reusable contract reference for Android convergence. The assessment covers four domains: auth/session, verification lifecycle, transaction integrity, and API surface.

**Verdict**: Suitable as a reference implementation for behavior and invariants. Not suitable for direct reuse as a production library without the gaps listed in [Section 5](#5-remaining-gaps).

---

## 1. Auth & Session

### What is implemented
- Server-side session via PostgreSQL (`connect-pg-simple`, cookie `world.sid`)
- Session fixation prevention: `session.regenerate()` on login
- Ghost session cleanup: `/auth/me` destroys sessions pointing to deleted users
- All protected routes gated by `requireAuth` middleware (single enforcement point in `routes/index.ts`)
- Cookie: `HttpOnly`, `SameSite=Lax`, `Secure` in production, 30-day expiry
- Logout: session destroyed + cookie cleared in one step

### Reuse notes for Android
- The server-side session model maps 1:1 to any token-based scheme (JWT, OAuth). The invariants (regenerate on login, clean stale tokens) are portable.
- Android clients should send `credentials: include` equivalent (cookie jar or auth header) on every request.
- The login model is username-only (no password). **Must add credential verification before any production deployment.**

### Readiness: ⚠️ Reference-safe, not production-safe
The session model is correctly structured. The missing element is a real credential factor.

---

## 2. Verification Lifecycle

### State machine
```
pending → processing → complete
```
Enforced in `routes/verification.ts`. Invalid transitions are rejected at the API layer. All state changes are wrapped in a single `db.transaction()`.

### What is implemented
- `proof` is required and validated non-empty
- `nullifierHash = sha256(sessionId + ":" + proof)` — deterministic, never synthesized
- Session ownership enforced: `verificationSessions.userId === req.session.userId`
- Atomic write order: mark processing → upsert verification → update user → mark complete
- Verification sessions expire in 10 minutes; verifications expire in 1 year

### Reuse notes for Android
- Replace the simulated `proof` string with the real ZKP output from the World ID Android SDK.
- The `nullifierHash` derivation formula is the canonical one — Android must reproduce it identically.
- The state machine transitions and the atomic write sequence are the portable primitives.

### Readiness: ✅ Ready for Android convergence
The lifecycle is correctly specified and testable. The only change needed is replacing the simulated proof with the real SDK output.

---

## 3. Transaction Integrity

### What is implemented
- Idempotency key checked first, before any balance mutation
- `SELECT … FOR UPDATE` row lock inside `db.transaction()` — prevents concurrent double-spend
- Balance check inside the lock: `currentBalance >= amount`
- Atomic debit + transaction record insert
- Deterministic error responses (400 for validation, 422 for insufficient balance, 200 for duplicate idempotency)
- Concurrency test: 5 parallel sends of `balance/2` → exactly 2 succeed, 3 rejected

### Reuse notes for Android
- Android clients must send `Idempotency-Key` headers for all send operations and handle `200` (existing) vs `201` (new) response codes.
- The 422 `Insufficient … balance` error is the canonical signal for retry-with-less or abort.
- The SELECT FOR UPDATE pattern is server-side only — no client-side locking is needed.

### Readiness: ✅ Ready for Android convergence

---

## 4. API Surface

### OpenAPI spec: `lib/api-spec/openapi.yaml`
All implemented routes have corresponding OpenAPI entries including:
- Auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Users: `GET /users/me`, `PATCH /users/me`
- Wallet: `GET /wallet`, `GET /wallet/tokens`
- Transactions: `GET /transactions`, `POST /transactions`, `GET /transactions/:id`
- Verification: `GET /verification/status`, `POST /verification/initiate`, `POST /verification/complete`
- Apps: `GET /apps`, `GET /apps/featured`, `GET /apps/:id`
- Contacts: `GET /contacts`, `POST /contacts`
- Notifications: `GET /notifications`, `PATCH /notifications/:id/read`
- Stats: `GET /stats/dashboard`, `GET /stats/token-prices`

### Reuse notes for Android
- Generate Android client from `lib/api-spec/openapi.yaml` using `openapi-generator-cli` or equivalent.
- All error responses follow `{ error: string }` — handle uniformly.
- Numeric fields stored as strings in DB are returned as numbers in JSON (coerced via `parseFloat`).

### Readiness: ✅ Spec complete and aligned to implementation

---

## 5. Remaining Gaps

| Gap | Domain | Risk | Action Required |
|-----|--------|------|-----------------|
| Username-only login, no credential verification | Auth | 🔴 High (production blocker) | Add password hash (bcrypt) or OAuth |
| No rate limiting on `/auth/login` | Auth | 🟡 Medium | Add `express-rate-limit` |
| Simulated proof in verification | Verification | 🟡 Medium (prototype only) | Integrate real World ID Android SDK |
| `POST /contacts` generates fake wallet address when none provided | Contacts | 🟡 Medium | Resolve address from username via user lookup |
| Token prices are simulated | Stats | 🟠 Informational | Integrate real price feed for production |
| No password reset or account recovery | Auth | 🔴 High (production blocker) | Out of scope for prototype phase |
| Session secret rotation | Ops | 🟡 Medium | Document rotation procedure; requires app restart |

---

## 6. Test Coverage

| Suite | Tests | Coverage |
|-------|-------|---------|
| auth.test.ts | 14 | Login/logout/me, 401 boundaries, ghost session, session fixation, ownership |
| verification.test.ts | 9 | Full lifecycle, proof validation, expiry, cross-user rejection, atomicity |
| transactions.test.ts | 9 | Validation, balance enforcement, idempotency, concurrency (SELECT FOR UPDATE) |
| stats.test.ts | 8 | Dashboard response shape, user-scoping, value calculation, token prices |
| **Total** | **40** | Core invariants covered |

---

## 7. Convergence Checklist for Android

- [ ] Generate Android API client from `lib/api-spec/openapi.yaml`
- [ ] Implement session management (token/cookie) with fixation prevention on login
- [ ] Handle ghost session: treat `userId: null` from `/auth/me` as unauthenticated, clear local auth state
- [ ] Integrate World ID Android SDK for real proof generation in verification flow
- [ ] Reproduce `nullifierHash = sha256(sessionId + ":" + proof)` — use same algorithm
- [ ] Send `Idempotency-Key` header on all transaction sends; handle `200` vs `201`
- [ ] Propagate 422 errors as "insufficient balance" to the user without retry
- [ ] Add credential verification to login before production
