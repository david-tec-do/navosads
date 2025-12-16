# ⚡ Ads Account Management - 快速开始

## 🎯 只需 3 步即可完成部署！

### 步骤 1: 设置加密密钥 (1 分钟)

在项目根目录创建或编辑 `.env.local` 文件，添加：

```bash
# 复制下面这行到你的 .env.local
ADS_TOKEN_ENCRYPTION_KEY=0b1b35b2e97a4671cc1bed80fb46ab6f
```

**💡 提示**: 这个密钥已经为你生成好了，直接复制使用即可

---

### 步骤 2: 执行数据库迁移 (2 分钟)

1. 打开 **Supabase Dashboard**: https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧 **"SQL Editor"**
4. 点击 **"New query"**
5. 复制粘贴以下SQL并点击 **"Run"**:

```sql
-- ============ 复制下面所有内容到 Supabase SQL Editor ============

-- 创建 Media 表
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

-- 创建 AdsAccountToken 表
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

-- 添加外键约束
DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_userId_User_id_fk" 
 FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_mediaId_Media_id_fk" 
 FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 插入 NewsBreak 平台
INSERT INTO "Media" (id, "displayName", description, "isActive", "createdAt", "updatedAt") 
VALUES ('newsbreak', 'NewsBreak', 'NewsBreak Ads Platform', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS "idx_ads_account_user_id" ON "AdsAccountToken"("userId");
CREATE INDEX IF NOT EXISTS "idx_ads_account_status" ON "AdsAccountToken"("status");

-- 验证
SELECT '✅ 安装成功！Media 表有 ' || COUNT(*)::text || ' 条记录' as result FROM "Media";
```

看到 `✅ 安装成功！` 就表示完成了！

---

### 步骤 3: 启动应用 (30 秒)

```bash
cd navosads
pnpm dev
```

访问 http://localhost:3000

---

## 🎉 开始使用！

1. **登录你的账户**
2. **点击左下角用户头像**
3. **选择 "Ads Account Management"**
4. **点击 "Add Account" 添加你的第一个广告账户！**

---

## 📸 功能预览

### 添加账户
- 选择平台（NewsBreak）
- 输入账户名称
- 输入 Access Token
- Token 自动加密存储 🔒

### 管理账户
- 查看所有账户
- 编辑账户信息
- 更新 Token
- 撤销/删除账户

---

## 🆘 遇到问题？

### 问题 1: "ADS_TOKEN_ENCRYPTION_KEY is not set"
**解决**: 检查 `.env.local` 是否正确设置了密钥，然后重启服务器

### 问题 2: "relation Media does not exist"  
**解决**: 在 Supabase SQL Editor 重新执行步骤 2 的 SQL

### 问题 3: Dialog 组件错误
**解决**: 已自动安装，如果还有问题运行 `pnpm install`

---

## 📚 更多文档

- `DEPLOYMENT_STEPS.md` - 详细部署指南
- `SETUP_ADS_ACCOUNTS.md` - 完整功能说明  
- `FIXES_APPLIED.md` - 已修复的问题

---

**🎯 现在就开始吧！3 分钟即可完成部署！**

