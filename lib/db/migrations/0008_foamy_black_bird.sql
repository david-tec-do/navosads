CREATE TABLE IF NOT EXISTS "AdsAccountToken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"mediaId" varchar(32) NOT NULL,
	"tokenName" varchar(128) NOT NULL,
	"encryptedAccessToken" text NOT NULL,
	"tokenIv" varchar(32) NOT NULL,
	"accountId" varchar(128),
	"accountEmail" varchar(128),
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"tokenExpiresAt" timestamp,
	"lastValidatedAt" timestamp,
	"lastUsedAt" timestamp,
	"lastErrorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Media" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"displayName" varchar(64) NOT NULL,
	"description" text,
	"logoUrl" text,
	"documentationUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_mediaId_Media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
