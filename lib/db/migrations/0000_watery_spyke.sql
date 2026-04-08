CREATE TYPE "public"."verification_level" AS ENUM('none', 'device', 'orb');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('send', 'receive', 'grant', 'swap');--> statement-breakpoint
CREATE TYPE "public"."verification_session_status" AS ENUM('pending', 'scanning', 'processing', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."app_category" AS ENUM('defi', 'social', 'gaming', 'nft', 'utility');--> statement-breakpoint
CREATE TYPE "public"."contact_verification_level" AS ENUM('none', 'device', 'orb');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('transaction', 'grant', 'verification', 'app', 'system');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"world_id" text,
	"verification_level" "verification_level" DEFAULT 'none' NOT NULL,
	"wallet_address" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"country" text,
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address" text NOT NULL,
	"wld_balance" numeric(30, 8) DEFAULT '0' NOT NULL,
	"usdc_balance" numeric(30, 8) DEFAULT '0' NOT NULL,
	"eth_balance" numeric(30, 18) DEFAULT '0' NOT NULL,
	"pending_grants" integer DEFAULT 0 NOT NULL,
	"next_grant_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(30, 8) NOT NULL,
	"amount_usd" numeric(20, 4) DEFAULT '0' NOT NULL,
	"token_symbol" text NOT NULL,
	"from_address" text,
	"to_address" text,
	"from_username" text,
	"to_username" text,
	"tx_hash" text,
	"note" text,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_transactions_user_idempotency" UNIQUE("user_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "verification_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"qr_code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" "verification_session_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"level" text DEFAULT 'none' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"nullifier_hash" text,
	"expires_at" timestamp,
	"can_claim_grant" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verifications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"category" "app_category" NOT NULL,
	"url" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"user_count" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 2),
	"requires_world_id" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contact_username" text NOT NULL,
	"contact_display_name" text NOT NULL,
	"contact_avatar_url" text,
	"contact_wallet_address" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_level" "contact_verification_level" DEFAULT 'none' NOT NULL,
	"last_transaction_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_created_at" ON "transactions" USING btree ("created_at");