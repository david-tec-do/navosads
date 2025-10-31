#!/bin/bash

# Ads Account Management 快速部署脚本
# 使用方法: chmod +x setup-ads-accounts.sh && ./setup-ads-accounts.sh

set -e

echo "🚀 Ads Account Management 部署脚本"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 检查 .env.local
echo "📋 步骤 1/3: 检查环境变量..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local 不存在，正在创建...${NC}"
    
    # 生成加密密钥
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))")
    
    cat > .env.local << EOF
# Ads Account Management
# 广告Token加密密钥（已自动生成）
ADS_TOKEN_ENCRYPTION_KEY=${ENCRYPTION_KEY}

# 请添加你的其他环境变量：
# POSTGRES_URL=your_supabase_connection_string
# AUTH_SECRET=your_auth_secret
EOF
    
    echo -e "${GREEN}✅ .env.local 已创建${NC}"
    echo -e "${YELLOW}⚠️  请在 .env.local 中添加你的 POSTGRES_URL 和 AUTH_SECRET${NC}"
    echo ""
else
    # 检查是否已有加密密钥
    if grep -q "ADS_TOKEN_ENCRYPTION_KEY" .env.local; then
        echo -e "${GREEN}✅ 加密密钥已存在${NC}"
    else
        ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))")
        echo "" >> .env.local
        echo "# Ads Account Management" >> .env.local
        echo "ADS_TOKEN_ENCRYPTION_KEY=${ENCRYPTION_KEY}" >> .env.local
        echo -e "${GREEN}✅ 已添加加密密钥到 .env.local${NC}"
    fi
fi

echo ""

# 步骤 2: 显示 SQL 命令
echo "📋 步骤 2/3: 数据库迁移"
echo ""
echo -e "${YELLOW}请在 Supabase SQL Editor 中执行以下 SQL:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第一步：创建表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat lib/db/migrations/0008_foamy_black_bird.sql
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第二步：插入初始数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat lib/db/migrations/seed_media.sql
echo ""

read -p "是否已在 Supabase 中执行了上述 SQL？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 请先执行 SQL 后再继续${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 数据库迁移确认完成${NC}"
echo ""

# 步骤 3: 安装依赖并启动
echo "📋 步骤 3/3: 启动应用..."
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    pnpm install
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "下一步："
echo "1. 确保 .env.local 中配置了所有必需的环境变量"
echo "2. 运行: pnpm dev"
echo "3. 访问用户菜单 -> Ads Account Management"
echo ""
echo "查看详细文档："
echo "- DEPLOYMENT_STEPS.md - 详细部署步骤"
echo "- SETUP_ADS_ACCOUNTS.md - 功能说明"
echo ""

