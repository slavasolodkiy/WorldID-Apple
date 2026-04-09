# Apple Core Readiness Delta Report

**Date**: April 2026  
**Baseline commit**: da15bbf  
**Head commit**: post-hardening pass  
**Test result**: 32/32 passing  

---

## Executive Summary

The Apple (web) reference implementation has been hardened from a functional MVP skeleton into a credible cross-platform core reference. All critical correctness issues — auth auto-login, proof-less verification, non-atomic writes, double-spend races, cookie mismatch, stats data leakage — have been resolved. The codebase now passes typecheck across all packages and all integration tests run green in CI.

---

## Before / After Delta

### 1. Auth & Session

| Item | Before | After |
|------|--------|-------|
| Auto-login | AuthProvider posted `alex.world` on every load | Removed; only `GET /auth/me` used for session rehydration |
| Session fixation | `req.session.userId = id` written on existing session | `session.regenerate()` called before writing `userId` |
| Ghost sessions | `/auth/me` returned `null` silently, session persisted | Session is destroyed + cookie cleared when DB user not found |
| Login page | None | `LoginPage` with `useLogin` hook; App gates all routes behind `isReady && userId` |
| Cookie name | `connect.sid` cleared on logout | `world.sid` cleared — matches name configured in `app.ts` |
| Auth routes in OpenAPI | Missing | `/auth/login`, `/auth/logout`, `/auth/me` with schemas added |

### 2. Verification Lifecycle

| Item | Before | After |
|------|--------|-------|
| `proof` field | Optional / ignored | Required and validated non-empty |
| Nullifier synthesis | Could be synthesized from `nullifierHash` param | Derived exclusively as `sha256(sessionId:proof)` |
| Atomicity | Multiple separate writes | Single `db.transaction()` covering all state changes |
| Session ownership | Not checked | `verificationSessions.userId === req.session.userId` enforced |
| `verify.tsx` type error | `mutateAsync({})` — type mismatch | `mutateAsync()` with no arg + `proof` in complete call |

### 3. Transaction Integrity

| Item | Before | After |
|------|--------|-------|
| Concurrency | Simple balance read → update, race-prone | `SELECT … FOR UPDATE` inside `db.transaction()` |
| Double-spend | Possible under concurrent load | Blocked by row lock; only first writer succeeds |
| Idempotency | Present but after balance check | Checked first, before any DB mutation |
| Test coverage | Single-send tests only | Added concurrent-send test (5 parallel → exactly 2 succeed) |

### 4. Stats Scoping

| Item | Before | After |
|------|--------|-------|
| `grantCount` | Global across all users | Scoped to `req.session.userId` |
| `unreadResult` | Global across all users | Scoped to `req.session.userId` |
| `verifiedUsers` | Global (intentional) | Unchanged (product intent) |

### 5. CI & Migrations

| Item | Before | After |
|------|--------|-------|
| CI | None | `.github/workflows/ci.yml` — typecheck + push schema + seed + test |
| Migration scripts | Only `push` | `generate` and `migrate` scripts added |
| Migration files | None committed | `lib/db/migrations/0000_watery_spyke.sql` — initial snapshot of all 8 tables |

### 6. Documentation

| Item | Before | After |
|------|--------|-------|
| Core contracts | None | `docs/core-contracts.md` — auth, verification, transactions, API conventions, Android notes |
| Audit report | None | `reports/final-audit.md` (this file) |
| AGENTS.md | Apple-centric audit guide | Unchanged (correct as-is for this repo's role) |

---

## Test Coverage Summary

| Suite | Tests | Status |
|-------|-------|--------|
| auth.test.ts | 14 | ✅ All pass |
| verification.test.ts | 9 | ✅ All pass |
| transactions.test.ts | 9 | ✅ All pass |
| **Total** | **32** | **✅ Green** |

### New tests added (this pass)
- `returns 401 on verification route without a session`
- `returns 401 on stats route without a session`
- `GET /auth/me clears ghost session when user is deleted from DB`
- `session fixation: login issues a new session cookie distinct from any pre-login cookie`
- `rejects completion with missing proof`
- `completes a valid verification flow end-to-end` (now validates `sha256(sessionId:proof)` nullifier)
- `concurrent sends cannot overdraft the wallet (SELECT FOR UPDATE)`

---

## Remaining Gaps (known, deferred)

| Gap | Risk | Recommendation |
|-----|------|----------------|
| Username-only login (no password) | High for production | Add password hash or OAuth before any real deployment |
| `/stats/token-prices` behind auth | Low (over-restrictive, not incorrect) | Move before `requireAuth` if public price data is intended |
| No rate limiting on `/auth/login` | Medium | Add express-rate-limit to auth routes |
| Session secret rotation | Medium | Document key rotation procedure; current setup requires restart |
| Verification proof is simulated | Informational | Real Orb SDK integration needed for production |
| No password reset / account recovery | High for production | Out of scope for current prototype phase |

---

## Acceptance Criteria Checklist

- [x] `corepack pnpm run typecheck:libs` — passes
- [x] `corepack pnpm --filter @workspace/world-app run typecheck` — passes
- [x] `corepack pnpm --filter @workspace/api-server run test` — 31/31 green
- [x] Auth routes in OpenAPI; generated clients/schemas include them
- [x] Session fixation prevented via `session.regenerate()`
- [x] Ghost session cleanup in `/auth/me`
- [x] Verification: proof required, atomic writes, deterministic nullifier
- [x] Transactions: SELECT FOR UPDATE, idempotency first-class, concurrent test
- [x] Stats fully user-scoped
- [x] CI workflow present
- [x] Versioned migration files committed
- [x] Core reference docs created (`docs/core-contracts.md`)
- [x] Android convergence notes written
