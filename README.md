# API Usage Tracker

Track usage of various APIs（用量、配额、限流等）.

## 目标

- 统一记录各 API 的调用量
- 监控配额与限流
- 支持多服务（Cursor、OpenAI、Stripe、Notion 等）

## 快速开始

```bash
# 1. 创建数据库
createdb api_usage_tracker

# 2. 配置 .env（复制 .env.example）
# DATABASE_URL=postgresql://user:password@localhost:5432/api_usage_tracker

# 3. 安装依赖并启动
npm install
npm run dev
```

访问 http://localhost:3847 查看首页。

### API Key 设置

在首页底部的「API Key 设置」中填写各服务的 Key，**存储于本地 PostgreSQL**。表 `api_keys` 会在首次使用时自动创建。

### Cursor 用量

- **Enterprise 团队**：在 API Key 设置中填写 Cursor Admin API Key（cursor.com/dashboard → Settings → Advanced → Admin API Keys）
- **个人 / Pro**：使用手动录入（本月消费 USD、限额可选），数据存 localStorage

## 项目结构

```
api-usage-tracker/
├── app/
│   ├── api/
│   │   ├── cursor/   # Cursor 用量
│   │   └── keys/    # API Key CRUD（存 PG）
│   ├── page.tsx     # 首页
│   └── layout.tsx
├── lib/db.ts        # PG 连接与 api_keys 表
├── .env.example
└── package.json
```

## 后续扩展

- OpenAI、Stripe、Notion 等服务的用量采集
- 持久化存储（SQLite / 数据库）
- 简单看板 / 图表
