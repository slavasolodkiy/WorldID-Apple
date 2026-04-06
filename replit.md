# Workspace

## Overview

pnpm workspace monorepo using TypeScript. A full-stack World App clone replicating the World (formerly Worldcoin) app from the Apple App Store.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui + framer-motion + Recharts
- **Routing**: wouter

## App Features

### World App Clone
A mobile-first (max-width 430px) web application replicating the World App:

1. **Wallet (`/`)** — Total portfolio balance in USD, WLD price mini chart (7-day area), quick actions (Send/Receive/Buy/Swap), token list with live balances/prices
2. **World ID (`/verify`)** — World ID verification status card (glass morphism + orb iris gradient), Orb verification simulation, device vs orb levels
3. **Ecosystem (`/apps`)** — dApps browser with featured apps, category filters (All/DeFi/Social/Gaming/NFT/Utility), search, app cards with ratings and user counts
4. **Profile (`/profile`)** — User profile with verification badge, bio, settings links
5. **Send (`/wallet/send`)** — Send tokens to contacts or addresses
6. **Receive (`/wallet/receive`)** — QR code display + wallet address copy
7. **Transactions (`/transactions`)** — Full history with type filters
8. **Notifications (`/notifications`)** — Notification feed with mark-read

### Architecture
- Bottom tab navigation (4 tabs: Wallet, World ID, Apps, Profile)
- Dark mode enabled (near-black background, cyan #00D4FF primary accent)
- Demo user pre-seeded: alex.world (ORB verified, $3,500 portfolio)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed` — re-seed demo data

## Database Schema

- `users` — User profiles with verification level, wallet address
- `wallets` — Token balances (WLD, USDC, ETH), grant info
- `transactions` — Send/receive/grant/swap history
- `verifications` — World ID verification status + nullifier hash
- `verification_sessions` — Orb scan sessions
- `apps` — World Chain dApps registry
- `contacts` — User contacts/address book
- `notifications` — Notification feed

## Artifacts

- `artifacts/world-app` — Frontend React + Vite (previewPath: `/`)
- `artifacts/api-server` — Express API server (previewPath: `/api`)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
