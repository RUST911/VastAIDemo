# VastAIDemo

Vastbase 产品 AI 产品化演示 Demo

## 项目简介

本项目是 Vastbase 海量数据库产品的 AI 智能化演示平台，展示了一站式智能数据库全生命周期管理能力。通过集成智能评估、数据迁移、故障诊断、全栈运维监控等功能，为数据库管理提供智能化解决方案。

## 整体流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        首页 (index.html)                         │
│                    智能数据库管理平台入口                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  智能评估      │       │  智能迁移      │       │  运维监控      │
│ module-install │       │module-migrate │       │module-monitor │
└───────────────┘       └───────────────┘       └───────────────┘
        │
        │         ┌─────────────────────────────────────────────┐
        └─────────▶              报错答疑模块                     │
                  └─────────────────────────────────────────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
                  │  跳转页面      │ │  问题提交      │ │  智能对话      │
                  │module-support │ │support-submit │ │ support-chat  │
                  └───────────────┘ └───────────────┘ └───────────────┘
                          │               │               │
                          │    (提交问题)   │   (开始对话)   │
                          └───────────────┴───────────────┘
```

## 功能模块

### 1. 智能评估 (module-install.html)

数据库和应用迁移评估模块，通过自动化评估数据库配置、兼容性、应用改造点及工作量，一键生成全面的迁移评估报告。

- 数据库配置评估
- 兼容性分析
- 应用改造点识别
- 工作量评估
- 评估报告生成

### 2. 智能迁移 (module-migrate.html)

智能数据迁移模块，支持全量和增量数据迁移，提供迁移进度监控和数据校验功能。

- 迁移任务配置
- 数据迁移执行
- 迁移进度监控
- 数据一致性校验

### 3. 报错答疑

Vastbase 智能助手"量仔"，提供智能问答和技术支持服务。

**页面流程：**
1. `module-support.html` - 跳转过渡页，显示加载动画后自动跳转
2. `support-submit.html` - 问题提交表单，填写问题标题、类型、描述及上传附件
3. `support-chat.html` - 智能对话界面，与 AI 助手进行实时对话

**功能特性：**
- 问题智能诊断
- 解决方案推荐
- 知识库检索
- 对话式交互
- 文件上传支持

### 4. 运维监控 (module-monitor.html)

智能运维监控模块，提供全方位的数据库运行状态监控和告警服务。

- 实时性能监控
- 资源使用统计
- 异常告警通知
- 历史数据分析

## 技术栈

- **前端框架**: 原生 HTML + Tailwind CSS
- **图表库**: Chart.js
- **图标库**: Font Awesome 4.7
- **Markdown 渲染**: marked.js
- **代码高亮**: highlight.js
- **开发服务器**: Node.js + http-server

## 环境要求

- **Node.js**: v14.0.0 或更高版本（推荐 v18+）
- **npm**: v6.0.0 或更高版本

可以通过以下命令检查当前版本：
```bash
node -v
npm -v
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

**方式一：使用 npm 脚本（推荐）**

```bash
npm run dev
```

**方式二：直接运行 Node.js**

```bash
node server.js
```

服务将在 `http://localhost:8081` 启动。

> **重要说明**：本项目包含一个代理服务器 (`server.js`)，用于转发 Dify API 请求并解决跨域问题。如果使用 Dify 模型进行对话，**必须**通过上述方式启动代理服务器，否则会出现 504 Gateway Timeout 错误。

### 可用的启动命令

| 命令 | 说明 | 端口 |
|------|------|------|
| `npm run dev` | 启动代理服务器（推荐，支持 Dify API 代理） | 8081 |
| `npm run dev:static` | 仅启动静态文件服务器（不支持 Dify 代理） | 8081 |

### API 代理说明

代理服务器 (`server.js`) 提供以下功能：

- **Dify API 代理**: `/api/dify/*` → `https://api.dify.ai/*`
- **超时设置**: 300 秒（适用于长时间的 AI 对话请求）
- **跨域支持**: 自动添加 CORS 头

## 项目结构

```
VastAIDemo/
├── index.html              # 首页/平台入口
├── module-install.html     # 智能评估模块
├── module-migrate.html     # 智能迁移模块
├── module-support.html     # 报错答疑跳转页
├── support-submit.html     # 报错答疑 - 问题提交表单
├── support-chat.html       # 报错答疑 - 智能对话界面
├── module-monitor.html     # 运维监控模块
├── server.js               # Node.js 代理服务器
├── package.json            # 项目配置
├── .gitignore              # Git 忽略配置
└── README.md               # 项目说明
```

## 页面导航关系

| 页面 | 入口 | 跳转目标 |
|------|------|----------|
| index.html | - | module-install.html, module-migrate.html, module-support.html, module-monitor.html |
| module-support.html | index.html | support-submit.html (自动跳转) |
| support-submit.html | module-support.html | support-chat.html (提交问题后) |
| support-chat.html | support-submit.html | - |
| module-install.html | index.html | - |
| module-migrate.html | index.html | - |
| module-monitor.html | index.html | - |

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 报错答疑模块详细说明

### 会话机制

报错答疑模块使用 `conversationId` 进行会话管理，确保用户对话的连续性和上下文保持：

- **会话持久化**: 会话 ID 自动存储在 localStorage，刷新页面不会丢失对话上下文
- **全局状态管理**: 通过 `AppState` 对象统一管理会话状态，包括：
  - `conversationId`: 当前会话的唯一标识符（UUID 格式）
  - `bigmodelConversationHistory`: GLM 模型的对话历史记录

### 重置对话

点击聊天界面右上角的「新对话」按钮可以开始新的对话：

1. 点击「新对话」按钮
2. 确认弹窗中点击「确定」
3. 系统将：
   - 生成新的 `conversationId`
   - 清空当前对话消息
   - 清除已上传的文件
   - 重置 GLM 对话历史

### 模型配置

支持两种类型的 AI 模型配置：

#### GLM 配置

| 字段 | 说明 | 是否必填 |
|------|------|----------|
| 模型名称 | 自定义显示名称 | 必填 |
| 模型选择 | GLM-5 / GLM-4.7 / GLM-4V | 必填 |
| API Key | 智谱 AI 的 API 密钥 | 必填 |
| Base URL | API 地址（默认为官方地址） | 选填 |

官方文档：https://open.bigmodel.cn/dev/api

#### Dify 配置

| 字段 | 说明 | 是否必填 |
|------|------|----------|
| 模型名称 | 自定义显示名称 | 必填 |
| API Key | Dify API 密钥 | 必填 |
| Base URL | API 地址（默认为官方地址） | 选填 |

官方文档：https://docs.dify.ai/

### GLM 与 Dify 功能对比

| 功能特性 | GLM | Dify |
|----------|-----|------|
| 文本对话 | ✅ | ✅ |
| 多轮对话 | ✅ (本地历史) | ✅ (服务端管理) |
| 文件上传 | ✅ (内容注入) | ✅ (服务端存储) |
| 自定义 Base URL | ✅ | ✅ |
| 连通性检测 | ✅ | ✅ |
| 视觉理解 | ✅ (GLM-4V) | 取决于应用配置 |

### 连通性检测

在添加模型配置时，点击「检测连通性」按钮可以验证配置是否正确：

- **GLM**: 发送测试请求验证 API Key 有效性
- **Dify**: 调用参数接口验证 API Key 和服务可达性

## 许可证

ISC
