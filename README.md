# VastAIDemo

Vastbase 智能数据库管理平台 — 一站式数据库全生命周期 AI 管理解决方案。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript |
| 构建 | Vite 6 |
| 路由 | Vue Router 4.5 |
| 状态管理 | Pinia 3 |
| 样式 | TailwindCSS 3.4 |
| 图表 | Chart.js 4.4 |
| Markdown | marked.js |
| 图标 | Font Awesome 4.7 |
| 后端 | Node.js（API 代理 + Dify SSE 流式对话） |

## 功能模块

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 平台首页，功能入口总览 |
| `/install` | InstallPage | 智能评估 — 数据库迁移评估与报告生成 |
| `/migrate` | MigratePage | 智能迁移 — 全量/增量数据迁移与校验 |
| `/chat` | SupportChatPage | AI 智能对话 — 量仔助手实时问答 |
| `/monitor` | MonitorPage | 运维监控 — 实时性能与告警 |

> `/support` 路由自动重定向到 `/chat`。

## 快速开始

### 环境要求

- Node.js ≥ 18
- pnpm（推荐）或 npm

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（含热更新）
pnpm dev
```

访问 http://localhost:3000，`/api` 请求自动代理到 `http://127.0.0.1:8081`，需同时启动后端：

```bash
node server.js
```

### 环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
vi .env
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PUBLIC_PORT` | 服务对外暴露端口（用户访问） | `3000` |
| `LOCAL_IP` | 服务器 IP 或域名 | `localhost` |
| `DIFY_API_BASE` | Dify API 地址 | — |
| `DIFY_API_KEY` | Dify API 密钥（必填） | — |

## Linux 生产部署

### 一键启动（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
vi .env   # 填写 DIFY_API_BASE、DIFY_API_KEY、LOCAL_IP

# 2. 赋权并启动
chmod +x start.sh stop.sh
bash start.sh
```

`start.sh` 会自动完成：
- 检测 `dist/` 是否存在，不存在则自动执行 `pnpm install && pnpm build`
- 以 `nohup` 后台运行 `server.js`
- 日志输出到 `./logs/server.log`
- PID 记录到 `./server.pid`

### 查看日志

```bash
tail -f logs/server.log
```

### 停止服务

```bash
bash stop.sh
# 或
kill $(cat server.pid)
```

### 重启服务

```bash
bash stop.sh && bash start.sh
```

### 验证部署

```bash
# 健康检查
curl http://localhost:3000/api/health

# 检查端口占用
ss -tlnp | grep 3000

# 开放防火墙（如使用 ufw）
ufw allow 3000/tcp
```

## 项目结构

```
VastAIDemo/
├── public/
│   └── avatar.png              # 量仔头像
├── src/
│   ├── api/index.ts            # API 请求封装（SSE、对话、文件上传）
│   ├── assets/                 # 静态资源
│   ├── components/
│   │   ├── AppHeader.vue       # 全局导航栏
│   │   └── AppFooter.vue       # 全局页脚
│   ├── composables/
│   │   ├── useStreamChat.ts    # SSE 流式聊天（节流渲染）
│   │   ├── usePolling.ts       # 消息轮询（指数退避）
│   │   └── useLoading.ts       # 加载状态管理
│   ├── pages/                  # 页面组件
│   ├── router/index.ts         # 路由配置
│   ├── stores/chat.ts          # Pinia 聊天状态
│   ├── styles/main.css         # 全局样式 + TailwindCSS
│   ├── types/index.ts          # TypeScript 类型定义
│   ├── utils/index.ts          # 工具函数
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口
├── logs/                       # 运行日志（自动创建）
│   └── server.log
├── server.js                   # Node.js 后端（dist 静态服务 + API 代理）
├── start.sh                    # 启动脚本
├── stop.sh                     # 停止脚本
├── server.pid                  # 运行时 PID（自动生成）
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # TailwindCSS 配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## AI 对话功能

SupportChatPage 提供：

- SSE 流式对话：实时流式输出 AI 回复，节流渲染（~60fps）
- 对话管理：侧边栏对话列表、新建/切换对话
- 文件上传：最多 5 个文件，支持预览
- Markdown 渲染：代码高亮、表格、列表等
- MVS 工单渲染：自动检测 JSON 格式并渲染为结构化卡片
- 消息轮询：指数退避策略（2s→5s→10s→30s→60s）

## 许可证

ISC
