# ✅ Account ID 修复说明

## 🔍 发现的问题

### 问题 1: API 调用失败
**错误**: NewsBreak API 返回错误，因为发送了空的 `accountIds` 数组

**原因**: 
- 用户在对话中询问预算时，没有提供具体的 account ID
- Tool 发送 `accountIds: []` 给 NewsBreak API
- 但 NewsBreak API **要求至少提供 1 个 account ID**

### 问题 2: UI 未引导用户填写 Account ID
- 表单中 Account ID 字段标记为"Optional"
- 用户可能不知道需要填写
- 导致后续查询失败

---

## ✅ 已实施的修复

### 修复 1: Tool 智能 Account ID 处理

**文件**: `lib/ai/tools/get-newsbreak-budget.ts`

**逻辑**:
```typescript
// 1. 优先使用用户在对话中指定的 accountIds
let accountIdsToQuery = input.accountIds || [];

// 2. 如果用户没指定，自动使用配置中的 accountId
if (accountIdsToQuery.length === 0) {
  if (account.accountId) {
    accountIdsToQuery = [account.accountId];  // ✅ 使用配置的 ID
  } else {
    return {
      error: "No account IDs provided...",  // ❌ 提示用户配置
    };
  }
}

// 3. 验证数量
if (accountIdsToQuery.length > 500) {
  return { error: "Too many account IDs..." };
}

// 4. 发送给 NewsBreak API
body: JSON.stringify({ accountIds: accountIdsToQuery })
```

**效果**:
- ✅ 用户说"查询预算" → 自动使用配置的 Account ID
- ✅ 用户说"查询账户 123 的预算" → 使用指定的 ID
- ✅ 未配置 Account ID → 友好提示引导设置

---

### 修复 2: UI 标记 Account ID 为必填

**文件**: `app/(chat)/settings/ads-accounts/page.tsx`

**变更**:

#### 2.1 添加表单字段标记为必填
```tsx
<Label htmlFor="accountId">Account ID *</Label>
<Input
  id="accountId"
  placeholder="e.g., 1981942764328771586"
  value={formData.accountId}
  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
/>
<p className="mt-1 text-muted-foreground text-xs">
  ℹ️ Required for budget queries. Find this in your NewsBreak dashboard.
</p>
```

#### 2.2 表单验证
```typescript
if (!formData.mediaId || !formData.tokenName || 
    !formData.accessToken || !formData.accountId) {
  toast({
    type: "error",
    description: "Please fill in all required fields (Platform, Account Name, Access Token, and Account ID)",
  });
  return;
}
```

#### 2.3 账户卡片显示
```tsx
{account.accountId && (
  <div>
    <span className="text-muted-foreground">Account ID: </span>
    <code className="rounded bg-muted px-1 py-0.5 text-xs">
      {account.accountId}
    </code>
  </div>
)}
```

---

## 🎯 用户体验改进

### 之前（❌）

1. 用户添加账户时，Account ID 字段为空（Optional）
2. 用户询问："查询预算"
3. Tool 发送 `accountIds: []`
4. NewsBreak API 返回错误
5. 用户困惑："为什么不能查？"

### 现在（✅）

1. 用户添加账户时，**必须填写 Account ID**（标记为 *）
2. 用户询问："查询预算"
3. Tool 自动使用配置的 Account ID
4. NewsBreak API 返回预算数据
5. 用户看到："您的账户 1981942764328771586 剩余预算 $800..."

---

## 📝 使用示例

### 场景 1: 使用配置的 Account ID（推荐）

**配置**:
```
Ads Account Management
├─ Platform: NewsBreak
├─ Account Name: 主账户
├─ Access Token: xxx
└─ Account ID: 1981942764328771586  ← 配置后自动使用
```

**对话**:
```
用户: "查询 NewsBreak 预算"
AI: [自动使用 1981942764328771586]
    "您的账户剩余预算 $800..."
```

---

### 场景 2: 指定特定账户

**对话**:
```
用户: "帮我查一下账号 1981942764328771586 的预算"
AI: [使用用户指定的 ID]
    "账户 1981942764328771586 的预算信息..."
```

---

### 场景 3: 未配置 Account ID

**对话**:
```
用户: "查询预算"
AI: "无法查询预算。请在 Ads Account Management 中配置您的 Account ID。"
```

---

## 🔄 Git 提交

```
c60f35e (HEAD -> main, origin/main)
   └─ feat: Add Account ID validation and UI improvements
```

**变更统计**:
- 2 个文件修改
- 52 行新增
- 4 行删除

---

## 📋 测试步骤

### 1. 添加账户时填写 Account ID
```
Platform: NewsBreak
Account Name: 测试账户
Access Token: [你的token]
Account ID: 1981942764328771586  ← 必填
```

### 2. 在对话中测试
```
"查询 NewsBreak 预算"
```

### 3. 验证结果
- ✅ Tool 自动使用配置的 Account ID
- ✅ NewsBreak API 返回数据
- ✅ 显示预算信息

---

## 🎊 修复完成！

现在用户只需：
1. 在 Ads Account Management 配置 Account ID
2. 在聊天中询问预算
3. AI 自动查询并返回结果

无需每次都手动指定 Account ID！

