# VastAIDemo（vastbase-support v2.0.0）

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
| Markdown | marked.js 15 |
| 图标 | Font Awesome 4.7 |
| 后端 | Node.js（静态服务 + Dify SSE 流式代理 + PostgreSQL 反馈存储） |
| 数据库 | PostgreSQL（pg 8.x） |

## 功能模块

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 平台首页，功能入口总览 |
| `/install` | InstallPage | 智能评估 — 迁移基础信息填写与兼容性评估 |
| `/migrate` | MigratePage | 智能迁移 — 迁移任务配置、SQL 改写与进度跟踪 |
| `/chat` | SupportChatPage | 工具报错智能答疑 — 量仔助手实时问答 |
| `/monitor` | MonitorPage | 智能运维监控 — 实时性能与告警 |
| `/feedback-admin` | FeedbackAdminPage | 反馈管理后台 — 统计概览与会话列表（需 Token 鉴权） |

> `/support` 路由自动重定向到 `/chat`。

---

## 智能答疑模块

智能答疑模块（`/chat`）是本平台的核心功能，基于 Dify 大模型平台构建，以对话形式帮助用户精准定位数据库工具报错的根因并给出解决方案。

### 核心能力

**多格式信息接入**
- 支持文本直接输入报错信息
- 支持上传日志文件、截图等附件（最多 10 个，图片 ≤ 10 MB，文档 ≤ 15 MB）
- 支持粘贴截图（Ctrl+V）和拖拽上传
- 支持通过 URL 链接引用外部文件

**SSE 流式对话**
- 基于 Server-Sent Events 实现实时流式输出，节流渲染（~60fps）
- 支持中途停止响应
- 网络异常自动重试（最多 5 次，间隔 3s）

**思考过程可视化**
- 支持 `<think>` 标签解析，将模型推理过程以折叠块形式展示
- 流式输出时实时渲染思考内容

**Workflow 工作流面板**
- 可视化展示 Dify Workflow 各节点执行状态（运行中 / 成功 / 失败）
- 显示每个节点耗时与 Token 消耗

**对话管理**
- 侧边栏展示历史对话列表，支持新建/切换对话
- 对话内容支持导出为报告文件

**MVS 工单集成**
- 支持外部系统通过 `POST /api/mvs/submit` 提交工单，自动跳转到答疑页面并发起对话
- 工单信息自动格式化为结构化问题描述，渲染为可视化卡片

**用户反馈**
- 每条 AI 回复支持点赞 / 踩评分及文字补充说明
- 反馈数据持久化到 PostgreSQL，管理员可通过 `/feedback-admin` 页面查看

**快捷建议**
- 首次进入展示常见问题建议，一键发起对话：
  - 如何排查 vastbase 连接超时问题？
  - 迁移时遇到字符集不兼容怎么处理？
  - 数据库性能突然下降如何定位？
  - 存储过程迁移报错怎么解决？

### 相关文件

| 文件 | 说明 |
|------|------|
| `src/pages/SupportChatPage.vue` | 答疑页面主组件 |
| `src/composables/useStreamChat.ts` | SSE 流式对话逻辑封装 |
| `src/components/WorkflowPanel.vue` | Workflow 节点状态面板 |
| `src/components/ThinkBlock.vue` | 思考过程折叠块 |
| `src/components/MvsTicketCard.vue` | MVS 工单卡片渲染 |
| `src/api/index.ts` | API 请求封装（SSE、上传、反馈） |
| `src/stores/chat.ts` | Pinia 聊天状态管理 |

---

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

| 变量 | 说明 | 示例 |
|------|------|------|
| `PUBLIC_PORT` | 服务对外暴露端口 | `3000` |
| `LOCAL_IP` | 服务器 IP 或域名 | `172.16.105.101` |
| `DIFY_API_BASE` | Dify API 地址（含 `/v1`） | `http://172.16.105.101:3001/v1` |
| `DIFY_API_KEY` | Dify 应用 API Key（必填） | `app-xxxx` |
| `PG_HOST` | PostgreSQL 主机 | `localhost` |
| `PG_PORT` | PostgreSQL 端口 | `5432` |
| `PG_DATABASE` | 数据库名 | `postgres` |
| `PG_USER` | 数据库用户 | `postgres` |
| `PG_PASSWORD` | 数据库密码 | — |
| `PG_SCHEMA` | Schema 名称 | `dify` |
| `FEEDBACK_ADMIN_TOKEN` | 反馈管理页鉴权 Token | — |

---

## 部署

### 本地开发

环境要求：Node.js ≥ 18，pnpm（推荐）或 npm。

```bash
# 1. 配置环境变量
copy .env.example .env
# 编辑 .env，填写 DIFY_API_BASE、DIFY_API_KEY 等

# 2. 安装依赖并启动开发服务器（含热更新）
pnpm install
pnpm dev
```

访问 http://localhost:3000，`/api` 请求自动代理到后端（`http://127.0.0.1:8081`）。需同时在另一个终端启动后端：

```bash
node server.js
# 或
pnpm start
```

或使用一键启动脚本（Windows）：

```bat
start.bat
```

停止服务：

```bat
stop.bat
```

---

### Linux 生产部署

#### 一键启动（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
vi .env   # 填写 DIFY_API_BASE、DIFY_API_KEY、LOCAL_IP 等

# 2. 赋权并启动
chmod +x start.sh stop.sh
bash start.sh
```

`start.sh` 会自动完成：
- 检测 `dist/` 是否存在，不存在则自动执行 `pnpm install && pnpm build`
- 以 `nohup` 后台运行 `server.js`
- 日志输出到 `./logs/server.log`
- PID 记录到 `./server.pid`

#### 查看日志

```bash
tail -f logs/server.log
```

#### 停止 / 重启服务

```bash
# 停止
bash stop.sh

# 重启
bash stop.sh && bash start.sh
```

#### 验证部署

```bash
# 健康检查
curl http://localhost:3000/api/health

# 检查端口占用
ss -tlnp | grep 3000

# 开放防火墙（如使用 ufw）
ufw allow 3000/tcp
```

---

## 项目结构

```
VastAIDemo/
├── public/
│   └── avatar.png              # 量仔头像
├── src/
│   ├── api/index.ts            # API 请求封装（SSE、对话、文件上传、反馈）
│   ├── assets/                 # 静态资源
│   ├── components/
│   │   ├── AppHeader.vue       # 全局导航栏
│   │   ├── AppFooter.vue       # 全局页脚
│   │   ├── WorkflowPanel.vue   # Workflow 节点状态面板
│   │   ├── ThinkBlock.vue      # 思考过程折叠块
│   │   └── MvsTicketCard.vue   # MVS 工单卡片
│   ├── composables/
│   │   ├── useStreamChat.ts    # SSE 流式聊天（节流渲染、自动重试）
│   │   ├── usePolling.ts       # 消息轮询（指数退避）
│   │   └── useLoading.ts       # 加载状态管理
│   ├── pages/
│   │   ├── HomePage.vue        # 平台首页
│   │   ├── SupportChatPage.vue # 智能答疑页面
│   │   ├── InstallPage.vue     # 迁移评估页面
│   │   ├── MigratePage.vue     # 智能迁移页面
│   │   └── FeedbackAdminPage.vue # 反馈管理页面
│   ├── router/index.ts         # 路由配置
│   ├── stores/chat.ts          # Pinia 聊天状态
│   ├── styles/main.css         # 全局样式 + TailwindCSS
│   ├── types/index.ts          # TypeScript 类型定义
│   ├── utils/index.ts          # 工具函数
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口
├── logs/                       # 运行日志（自动创建）
│   └── server.log
├── server.js                   # Node.js 后端（静态服务 + API 代理）
├── start.sh / stop.sh          # Linux 启动/停止脚本
├── start.bat / stop.bat        # Windows 启动/停止脚本
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 许可证

ISC
