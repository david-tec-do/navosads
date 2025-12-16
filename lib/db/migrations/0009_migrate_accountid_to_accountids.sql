-- Migration: Change accountId (varchar) to accountIds (jsonb array)
-- This migration preserves existing data by converting single accountId to array

-- Step 1: Add new accountIds column
ALTER TABLE "AdsAccountToken" 
ADD COLUMN IF NOT EXISTS "accountIds" jsonb;

-- Step 2: Migrate existing accountId data to accountIds array
UPDATE "AdsAccountToken"
SET "accountIds" = jsonb_build_array("accountId")
WHERE "accountId" IS NOT NULL;

-- Step 3: Drop old accountId column
ALTER TABLE "AdsAccountToken" 
DROP COLUMN IF EXISTS "accountId";

-- Verification query (optional)
-- SELECT id, "tokenName", "accountIds" FROM "AdsAccountToken" LIMIT 5;

