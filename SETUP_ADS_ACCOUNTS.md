# Ads Account Management - 部署说明

## ✅ 已完成的工作

所有代码已经实现完毕！包括：

1. ✅ 数据库表设计（Media 和 AdsAccountToken）
2. ✅ Token 加密/解密工具函数
3. ✅ 数据库 CRUD 操作函数
4. ✅ API 路由（/api/ads-accounts）
5. ✅ 管理页面 UI（/settings/ads-accounts）
6. ✅ 用户菜单入口
7. ✅ 数据库迁移文件已生成

## 🔧 还需要完成的步骤

### 1. 设置加密密钥

在 `.env.local` 文件中添加（如果还没有）：

```bash
# 广告Token加密密钥（必须32字节）
# 生成方法：node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"
ADS_TOKEN_ENCRYPTION_KEY=your-32-character-secret-key!!
```

**⚠️ 重要：请生成一个真正的随机密钥！**

```bash
# 在终端运行以下命令生成密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"
```

### 2. 推送数据库迁移到 Supabase

由于网络原因，`drizzle-kit push` 命令可能需要在 Supabase Dashboard 中手动执行。

**方法 A：使用 Drizzle Kit（推荐）**

```bash
cd navosads
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
export ALL_PROXY=socks5://127.0.0.1:1080
pnpm drizzle-kit push
```

**方法 B：在 Supabase SQL Editor 中手动执行**

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单 "SQL Editor"
4. 复制并执行 `lib/db/migrations/0008_foamy_black_bird.sql` 中的 SQL
5. 然后执行 `lib/db/migrations/seed_media.sql` 插入初始数据

### 3. 插入初始 Media 数据

在 Supabase SQL Editor 中执行：

```sql
-- Insert NewsBreak platform
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

或者直接运行：
```bash
cd navosads
psql $POSTGRES_URL -f lib/db/migrations/seed_media.sql
```

### 4. 重启开发服务器

```bash
cd navosads
pnpm dev
```

## 🎯 使用方法

1. **访问 Ads Account Management**
   - 点击左下角用户头像
   - 选择 "Ads Account Management"

2. **添加广告账户**
   - 点击 "Add Account" 按钮
   - 选择平台：NewsBreak
   - 填写账户名称
   - 输入 Access Token
   - 点击 "Add Account"

3. **管理账户**
   - 编辑：更新账户信息和 Token
   - 删除：撤销账户访问

## 📂 文件结构

```
navosads/
├── lib/db/
│   ├── schema.ts                    # 数据库表定义（Media + AdsAccountToken）
│   ├── utils.ts                     # 加密/解密工具
│   ├── queries.ts                   # 数据库操作函数
│   └── migrations/
│       ├── 0008_foamy_black_bird.sql  # 表创建迁移
│       └── seed_media.sql             # 初始数据
├── app/(chat)/
│   ├── api/ads-accounts/
│   │   ├── route.ts                 # GET /api/ads-accounts, POST
│   │   └── [id]/route.ts            # GET/PATCH/DELETE /api/ads-accounts/:id
│   └── settings/ads-accounts/
│       └── page.tsx                 # 管理页面 UI
└── components/
    └── sidebar-user-nav.tsx         # 用户菜单（已添加入口）
```

## 🔐 安全特性

✅ **Token 加密存储**
- 使用 AES-256-GCM 军事级加密
- 每个 Token 独立的初始化向量（IV）
- 包含认证标签防篡改

✅ **访问控制**
- 所有 API 验证 session
- 仅能操作自己的 Token
- 防止横向越权攻击

✅ **审计日志**
- 记录创建/更新/删除时间
- 记录最后使用时间
- 保留错误信息用于调试

## 🐛 故障排查

### Token 加密错误

如果看到 `ADS_TOKEN_ENCRYPTION_KEY environment variable is not set` 错误：
- 确认 `.env.local` 中设置了 `ADS_TOKEN_ENCRYPTION_KEY`
- 确认密钥长度为 32 字符
- 重启开发服务器

### 数据库连接错误

如果看到 `Invalid URL` 或数据库连接错误：
- 确认 `POSTGRES_URL` 环境变量正确设置
- 检查 Supabase 项目状态
- 确认数据库表已创建

### 页面 404 错误

如果 `/settings/ads-accounts` 返回 404：
- 确认文件路径：`app/(chat)/settings/ads-accounts/page.tsx`
- 重启开发服务器
- 清除 Next.js 缓存：`rm -rf .next`

## 📝 后续扩展

未来可以添加：
- [ ] 更多广告平台（Google Ads、Facebook Ads 等）
- [ ] Token 有效性测试功能
- [ ] Token 自动刷新机制
- [ ] 使用统计和报表
- [ ] OAuth 2.0 授权流程

---

**🎉 恭喜！Ads Account Management 功能已准备就绪！**

