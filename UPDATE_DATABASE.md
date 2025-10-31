# 🔄 数据库更新指南 - 支持多个 Account IDs

## 📋 需要执行的更新

由于将 `accountId` (单个) 改为 `accountIds` (数组)，需要更新数据库表结构。

---

## 🚀 执行步骤（2 分钟）

### 步骤 1: 打开 Supabase SQL Editor

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧 "SQL Editor"
4. 点击 "+ New query"

---

### 步骤 2: 复制并执行以下 SQL

**直接复制下面的完整 SQL 到 SQL Editor：**

```sql
-- ============================================================
-- 数据库更新：支持多个 Account IDs
-- 将 accountId (varchar) 改为 accountIds (jsonb array)
-- ============================================================

-- Step 1: 添加新的 accountIds 列（jsonb 类型）
ALTER TABLE "AdsAccountToken" 
ADD COLUMN IF NOT EXISTS "accountIds" jsonb;

-- Step 2: 迁移现有数据
-- 将已有的 accountId 转换为数组格式
UPDATE "AdsAccountToken"
SET "accountIds" = jsonb_build_array("accountId")
WHERE "accountId" IS NOT NULL;

-- Step 3: 删除旧的 accountId 列
ALTER TABLE "AdsAccountToken" 
DROP COLUMN IF EXISTS "accountId";

-- Step 4: 验证迁移结果
SELECT 
  "tokenName", 
  "accountIds",
  jsonb_array_length(COALESCE("accountIds", '[]'::jsonb)) as account_count
FROM "AdsAccountToken"
LIMIT 10;

-- 完成提示
SELECT '✅ 数据库更新完成！现在支持多个 Account IDs' as status;
```

---

### 步骤 3: 点击 "Run" 执行

- 在 SQL Editor 右下角点击绿色 **"Run"** 按钮
- 等待几秒钟

---

### 步骤 4: 验证结果

执行成功后，你应该看到：

```
✅ 数据库更新完成！现在支持多个 Account IDs
```

以及现有账户的数据（如果有的话）：
```
tokenName    | accountIds              | account_count
-------------|-------------------------|---------------
测试账户     | ["1981942764328771586"] | 1
```

---

## 📊 数据迁移说明

### 迁移逻辑

**旧结构**:
```sql
accountId: varchar(128)  -- 单个字符串
例如: "1981942764328771586"
```

**新结构**:
```sql
accountIds: jsonb  -- 字符串数组
例如: ["1981942764328771586", "9876543210123456789"]
```

### 数据转换

- ✅ 已有数据自动转换：`"123"` → `["123"]`
- ✅ NULL 值保持为 NULL
- ✅ 不会丢失任何数据

---

## 🎯 完成后的新功能

### 1. UI 输入支持多个 ID

**添加账户时**:
```
Account IDs: 1981942764328771586, 9876543210123456789, 1234567890
             ↑ 用逗号分隔
```

### 2. 自动查询所有配置的账户

**对话示例**:
```
用户: "查询 NewsBreak 预算"

AI: [自动查询所有配置的 Account IDs]
    "您配置的 3 个 NewsBreak 账户预算情况：
    
    账户 1981942764328771586:
    - 剩余: $800
    - 上限: $1000
    
    账户 9876543210123456789:
    - 剩余: $500
    - 上限: $1000
    
    总计剩余: $1300"
```

### 3. 卡片显示多个 ID

账户卡片会显示为：
```
Account IDs: [1981942764328771586] [9876543210123456789] [1234567890]
             ↑ 每个 ID 一个独立的徽章
```

---

## 🆘 故障排查

### 问题 1: "column accountId does not exist"
**原因**: 表还没有 accountId 列（可能是新数据库）
**解决**: 跳过 Step 2 和 Step 3，只执行：
```sql
ALTER TABLE "AdsAccountToken" 
ADD COLUMN IF NOT EXISTS "accountIds" jsonb;
```

### 问题 2: "column accountIds already exists"
**原因**: 已经执行过迁移
**解决**: 无需重复执行，数据库已是最新状态

### 问题 3: 执行后看不到数据
**原因**: 可能还没有添加过账户
**解决**: 这是正常的，添加第一个账户后就会有数据

---

## 🔄 如果需要回滚

如果需要回退到单个 accountId（不推荐）：

```sql
-- 回滚：将数组改回单个字符串
ALTER TABLE "AdsAccountToken" 
ADD COLUMN IF NOT EXISTS "accountId" varchar(128);

UPDATE "AdsAccountToken"
SET "accountId" = "accountIds"->0::text
WHERE "accountIds" IS NOT NULL;

ALTER TABLE "AdsAccountToken" 
DROP COLUMN "accountIds";
```

---

## ✅ 完成后

1. **刷新应用页面**
2. **添加新的 NewsBreak 账户**（使用新的多 ID 格式）
3. **在聊天中测试**: "查询 NewsBreak 预算"

---

**📚 相关文档**: 
- `QUICK_START.md` - 完整部署指南
- `lib/db/migrations/0009_migrate_accountid_to_accountids.sql` - 迁移 SQL

**🎊 执行完成后，就可以一个 Token 管理多个账户了！**

