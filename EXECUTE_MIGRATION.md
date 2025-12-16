# 🚀 执行数据库迁移 - 详细步骤

## 📋 准备工作

你需要：
1. ✅ Supabase 账号和项目
2. ✅ 访问 Supabase Dashboard 的权限

---

## 🎯 执行步骤（只需 2 分钟）

### 步骤 1: 打开 Supabase SQL Editor

1. 访问 **https://supabase.com/dashboard**
2. 登录你的账号
3. 选择你的项目
4. 点击左侧菜单的 **"SQL Editor"**
5. 点击 **"+ New query"** 按钮

---

### 步骤 2: 复制并执行以下 SQL

**直接复制下面的完整 SQL 代码到 SQL Editor：**

```sql
-- ============================================================
-- Ads Account Management - 完整数据库设置
-- ============================================================

-- 创建 Media 表（广告平台配置）
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

-- 创建 AdsAccountToken 表（用户Token）
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
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "AdsAccountToken" ADD CONSTRAINT "AdsAccountToken_mediaId_Media_id_fk" 
 FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 插入 NewsBreak 平台数据
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

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS "idx_ads_account_user_id" ON "AdsAccountToken"("userId");
CREATE INDEX IF NOT EXISTS "idx_ads_account_status" ON "AdsAccountToken"("status");
CREATE INDEX IF NOT EXISTS "idx_media_active" ON "Media"("isActive");

-- 验证安装
SELECT 'Media 表记录数: ' || COUNT(*)::text as result FROM "Media";
SELECT 'AdsAccountToken 表已创建' as result WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'AdsAccountToken'
);

-- 完成提示
SELECT '✅ Ads Account Management 数据库设置完成！' as status;
```

---

### 步骤 3: 点击 "Run" 按钮

- 在 SQL Editor 右下角找到绿色的 **"Run"** 按钮
- 点击执行
- 等待几秒钟

---

### 步骤 4: 验证结果

执行成功后，你应该在 "Results" 面板看到：

```
✅ Ads Account Management 数据库设置完成！
```

以及显示：
- `Media 表记录数: 1`
- `AdsAccountToken 表已创建`

---

## ✅ 完成！

现在：
1. 回到你的应用：http://localhost:3000
2. 刷新页面
3. 点击用户头像 → "Ads Account Management"
4. 应该能看到美观的 empty state，可以开始添加账户了！

---

## 🔍 验证表是否创建成功

如果想确认表已创建，可以在 Supabase 中：

### 方法 1: 使用 Table Editor
- 左侧菜单点击 "Table Editor"
- 应该能看到 `Media` 和 `AdsAccountToken` 两个表

### 方法 2: 使用 SQL 查询
```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Media', 'AdsAccountToken');

-- 查看 Media 表数据
SELECT * FROM "Media";
```

---

## 🆘 遇到问题？

### 问题 1: "relation User does not exist"
**原因**: User 表还不存在
**解决**: 确保你的应用已经运行过并且用户表已创建（通过注册或登录）

### 问题 2: 执行后没有任何输出
**解决**: 这是正常的，表已经创建成功。运行验证 SQL 查询确认：
```sql
SELECT * FROM "Media";
```

### 问题 3: "permission denied"
**解决**: 确保你是项目的 Owner 或有足够的权限

---

## 📸 截图参考

### 1. SQL Editor 位置
```
Dashboard → 你的项目 → SQL Editor (左侧菜单)
```

### 2. 执行按钮
```
SQL 输入框下方 → 绿色 "Run" 按钮
```

### 3. 成功结果
```
Results 面板显示：
✅ Ads Account Management 数据库设置完成！
```

---

**🎉 完成后别忘了刷新你的应用页面！**

