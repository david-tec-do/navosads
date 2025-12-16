CREATE TABLE IF NOT EXISTS "InvitationCode" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"usedBy" uuid,
	"usedAt" timestamp,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "InvitationCode_id_pk" PRIMARY KEY("id"),
	CONSTRAINT "InvitationCode_code_unique" UNIQUE("code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_usedBy_User_id_fk" FOREIGN KEY ("usedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

