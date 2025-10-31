-- ============================================================
-- Ads Account Management - 完整数据库设置
-- 在 Supabase SQL Editor 中一次性执行此文件
-- ============================================================

-- 步骤 1: 创建 Media 表（广告平台配置）
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

-- 步骤 2: 创建 AdsAccountToken 表（用户Token）
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

-- 步骤 3: 添加外键约束
DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_userId_User_id_fk" 
 FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_mediaId_Media_id_fk" 
 FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 步骤 4: 插入初始 Media 数据（NewsBreak）
INSERT INTO "Media" (id, "displayName", description, "isActive", "createdAt", "updatedAt") 
VALUES (
  'newsbreak',
  'NewsBreak',
  'NewsBreak Ads Platform',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 步骤 5: 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS "idx_ads_account_user_id" ON "AdsAccountToken"("userId");
CREATE INDEX IF NOT EXISTS "idx_ads_account_status" ON "AdsAccountToken"("status");
CREATE INDEX IF NOT EXISTS "idx_media_active" ON "Media"("isActive");

-- 验证安装
SELECT 'Media 表记录数: ' || COUNT(*)::text FROM "Media";
SELECT 'AdsAccountToken 表已创建' WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'AdsAccountToken'
);

-- 完成提示
SELECT '✅ Ads Account Management 数据库设置完成！' as status;

