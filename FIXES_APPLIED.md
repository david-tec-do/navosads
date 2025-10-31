# 修复说明

## 已修复的问题

### 1. ✅ 缺少 Dialog 组件
**错误**：`Module not found: Can't resolve '@/components/ui/dialog'`

**解决方案**：
- 创建了 `components/ui/dialog.tsx`
- 安装了 `@radix-ui/react-dialog` 包

### 2. ✅ crypto 模块客户端导入错误
**错误**：`You're importing a component that needs "server-only"`

**解决方案**：
- 将加密函数分离到专门的服务器端文件 `lib/db/encryption.ts`
- `encryption.ts` 使用 `import "server-only";` 确保只在服务器端运行
- `utils.ts` 保持为通用工具文件，可以在客户端和服务器端使用
- 更新 `queries.ts` 导入路径

## 文件变更

1. **新建文件**
   - `components/ui/dialog.tsx` - Dialog 组件实现
   - `lib/db/encryption.ts` - Token 加密/解密工具（服务器端专用）
   - `lib/db/migrations/seed_media.sql` - NewsBreak 初始数据
   - `SETUP_ADS_ACCOUNTS.md` - 部署文档

2. **修改文件**
   - `lib/db/utils.ts` - 移除加密函数，保留密码哈希函数
   - `lib/db/queries.ts` - 更新导入路径

3. **依赖更新**
   - 添加 `@radix-ui/react-dialog@1.1.15`

## 验证步骤

运行以下命令验证修复：

```bash
cd navosads
pnpm dev
```

应该可以正常启动，没有错误！

## 下一步

1. 设置 `.env.local` 中的 `ADS_TOKEN_ENCRYPTION_KEY`
2. 在 Supabase 执行数据库迁移
3. 访问 `/settings/ads-accounts` 测试功能

