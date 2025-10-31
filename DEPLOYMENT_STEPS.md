# 🚀 Ads Account Management - 部署步骤

## 步骤 1: 设置环境变量

在项目根目录创建 `.env.local` 文件（如果还没有），添加以下内容：

```bash
# 你已有的环境变量...
POSTGRES_URL=your_supabase_connection_string
AUTH_SECRET=your_auth_secret

# 新增：广告Token加密密钥（必须32字符）
ADS_TOKEN_ENCRYPTION_KEY=0b1b35b2e97a4671cc1bed80fb46ab6f
```

**⚠️ 重要提示：**
- 上面的 `ADS_TOKEN_ENCRYPTION_KEY` 已经为你生成好了
- 请妥善保管这个密钥，丢失后将无法解密已有的 Token
- 不要将 `.env.local` 提交到 git

## 步骤 2: 在 Supabase 执行数据库迁移

### 方法 A: 使用 Supabase Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单点击 "SQL Editor"
   - 点击 "New query"

3. **执行表创建 SQL**
   ```sql
   -- 复制以下内容到 SQL Editor
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
   ```
   - 点击 "Run" 执行

4. **插入 NewsBreak 初始数据**
   - 新建另一个 query
   ```sql
   -- 插入 NewsBreak 平台
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
   ```
   - 点击 "Run" 执行

5. **验证表创建成功**
   ```sql
   -- 查看 Media 表
   SELECT * FROM "Media";
   
   -- 查看表结构
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('Media', 'AdsAccountToken');
   ```

### 方法 B: 使用命令行（需要代理）

```bash
cd navosads
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
export ALL_PROXY=socks5://127.0.0.1:1080

# 推送迁移
pnpm drizzle-kit push

# 或者直接执行 SQL 文件
psql $POSTGRES_URL -f lib/db/migrations/0008_foamy_black_bird.sql
psql $POSTGRES_URL -f lib/db/migrations/seed_media.sql
```

## 步骤 3: 启动开发服务器

```bash
cd navosads
pnpm dev
```

访问 http://localhost:3000 （或你的端口）

## 步骤 4: 测试功能

1. **登录你的账户**

2. **访问 Ads Account Management**
   - 点击左下角用户头像
   - 选择 "Ads Account Management"

3. **添加测试账户**
   - 点击 "Add Account" 按钮
   - 填写：
     - Platform: NewsBreak
     - Account Name: 测试账户
     - Access Token: 随便填写一个测试 token
   - 点击 "Add Account"

4. **验证功能**
   - ✅ 能看到账户列表
   - ✅ 能编辑账户
   - ✅ 能删除账户
   - ✅ Token 已加密存储（在数据库中看不到明文）

## 🎉 完成！

现在 Ads Account Management 功能已经完全可用！

## 📝 快速参考

### 数据库表
- `Media` - 广告平台配置（系统管理）
- `AdsAccountToken` - 用户的广告账户 Token（用户数据）

### API 端点
- `GET /api/ads-accounts` - 获取所有账户
- `POST /api/ads-accounts` - 创建账户
- `GET /api/ads-accounts/:id` - 获取单个账户
- `PATCH /api/ads-accounts/:id` - 更新账户
- `DELETE /api/ads-accounts/:id` - 删除账户

### 页面路由
- `/settings/ads-accounts` - 管理页面

### 安全特性
- ✅ AES-256-GCM 加密
- ✅ 独立 IV 防重放攻击
- ✅ 认证标签防篡改
- ✅ 用户隔离（只能访问自己的 Token）

## 🆘 故障排查

### 问题 1: 加密密钥错误
```
Error: ADS_TOKEN_ENCRYPTION_KEY environment variable is not set
```
**解决**：确认 `.env.local` 中设置了 `ADS_TOKEN_ENCRYPTION_KEY`，然后重启服务器

### 问题 2: 数据库表不存在
```
relation "Media" does not exist
```
**解决**：在 Supabase SQL Editor 中执行步骤 2 的 SQL 语句

### 问题 3: 外键约束错误
```
foreign key constraint "AdsAccountToken_mediaId_Media_id_fk"
```
**解决**：确保先创建 `Media` 表，再插入初始数据

---

**需要帮助？** 查看 `SETUP_ADS_ACCOUNTS.md` 获取更多详情

