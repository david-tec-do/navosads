# NewsBreak Budget Info Tool

## 功能说明

这是一个为 LLM 提供的 AI Tool，用于查询 NewsBreak 广告账户的预算信息。

## 工作原理

1. **自动获取 Token**
   - 从数据库读取用户配置的 NewsBreak Token
   - 自动解密 Token
   - 验证 Token 状态（必须是 active）

2. **调用 NewsBreak API**
   - 端点: `https://business.newsbreak.com/business-api/v1/balance/getAccountBudgetInfo`
   - 方法: POST
   - 认证: 使用解密后的 Access-Token

3. **返回预算信息**
   - 账户剩余预算（accountRemaining）
   - 账户支出上限（accountSpendingCap）
   - 账户总支出（accountTotalSpend）

## 使用场景

LLM 可以在对话中主动调用此 Tool，例如：

**用户**: "帮我查一下 NewsBreak 的预算还剩多少"

**LLM 行为**:
1. 调用 `getNewsbreakBudget` tool
2. 自动获取用户的 NewsBreak Token
3. 查询预算信息
4. 返回格式化的预算数据

## API 参数

### 输入

```typescript
{
  accountIds?: string[]  // 可选：要查询的账户ID列表，最多500个
}
```

- 如果不提供 `accountIds`，则查询所有可用账户
- 如果提供，最多支持 500 个账户 ID

### 输出（成功）

```typescript
{
  success: true,
  accountName: string,  // 用户配置的账户名称
  budgetInfo: [
    {
      accountId: string,
      accountRemaining: string,      // 剩余预算
      accountSpendingCap: string,    // 支出上限
      accountTotalSpend: string,     // 总支出
      canViewBudget: boolean,        // 是否有权限查看
      failMessage?: string           // 失败原因（如果 canViewBudget=false）
    }
  ],
  summary: {
    totalAccounts: number,          // 查询的账户总数
    accountsWithAccess: number      // 有权限的账户数
  }
}
```

### 输出（失败）

```typescript
{
  error: string,        // 错误信息
  setupUrl?: string,    // 设置页面URL（如果需要配置）
  code?: number,        // NewsBreak API 错误码
  details?: string      // 详细错误信息
}
```

## 错误处理

### 1. 用户未配置 NewsBreak Token
```json
{
  "error": "No active NewsBreak account configured. Please add a NewsBreak account token in Ads Account Management.",
  "setupUrl": "/settings/ads-accounts"
}
```

### 2. Token 已过期或无效
```json
{
  "error": "Token expired"
}
```

### 3. API 调用失败
```json
{
  "error": "NewsBreak API request failed: 401 Unauthorized"
}
```

### 4. 账户 ID 过多
```json
{
  "error": "Too many account IDs. Maximum 500 accounts per request."
}
```

## 安全特性

✅ **Token 安全**
- Token 从数据库中加密存储
- 只在执行时临时解密
- 解密后的 Token 不会暴露给前端

✅ **用户隔离**
- 只能访问自己配置的 Token
- 验证 userId 防止越权

✅ **状态检查**
- 只使用 status=active 的账户
- 自动更新最后使用时间

## 示例对话

### 示例 1: 查询预算

**用户**: "我的 NewsBreak 账户还有多少预算？"

**LLM 调用**:
```typescript
getNewsbreakBudget({})
```

**LLM 响应**: 
"您的 NewsBreak 主账户预算情况如下：
- 剩余预算: $800.00
- 支出上限: $1,000.00
- 已使用: $200.00
- 使用率: 20%"

### 示例 2: 查询特定账户

**用户**: "帮我查一下账户 123456 的预算"

**LLM 调用**:
```typescript
getNewsbreakBudget({
  accountIds: ["123456"]
})
```

### 示例 3: 未配置 Token

**用户**: "查一下 NewsBreak 预算"

**LLM 响应**:
"您还没有配置 NewsBreak 账户。请前往 Ads Account Management 添加您的 NewsBreak Token。"

## 集成位置

- **文件**: `lib/ai/tools/get-newsbreak-budget.ts`
- **注册**: `app/(chat)/api/chat/route.ts` - line 197
- **激活**: 在 `experimental_activeTools` 列表中

## 技术栈

- **AI SDK**: Vercel AI SDK `tool()` function
- **验证**: Zod schema validation
- **加密**: AES-256-GCM (通过 `getDecryptedAccessToken`)
- **数据库**: Drizzle ORM + PostgreSQL (Supabase)

## 未来扩展

可以添加更多 NewsBreak API 工具：
- [ ] 获取广告系列信息
- [ ] 创建/更新广告
- [ ] 获取广告报表
- [ ] 管理广告预算

每个 tool 都可以复用相同的 Token 获取逻辑。

---

**📚 相关文档**:
- NewsBreak API 文档: https://business.newsbreak.com/business-api-doc/

