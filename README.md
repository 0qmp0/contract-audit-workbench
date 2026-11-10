# 合同/协议条款辅助审阅与规则审计工作台 (Contract Audit Workbench)

> **全国高校AI Web开发挑战赛 参赛作品**
> 本工具基于 AI Native 理念构建，致力于解决法务与业务人员在日常合同审阅中面临的“信息提取繁琐、人工核对易漏、隐私担忧”等痛点。
> **边界声明**：本工具仅提供辅助审阅与审计，不提供法律意见，最终判断由人工完成。

## 核心功能亮点

1. **动态条款智能提取**：接入 DeepSeek 大模型，不再局限于固定模板，可智能识别任意合同（如租赁、劳务、采购）并提取核心条款（付款方式、违约责任等）。
2. **双重校验与 RAG 增强**：提取结果自动经过本地规则引擎（校验金额、日期等格式）与本地法务知识库（匹配合规建议），实现“AI 提取 + 本地 RAG 知识增强”。
3. **三重审计与幻觉拦截**：独创“AI 原始输出 + 规则判定依据 + 原文精准溯源”三栏联动架构。若 AI 引用了原文中不存在的片段，系统将自动标记为“疑似幻觉”并拦截。
4. **端云协同推理**：引入 Web Worker 与 `Transformers.js`，在浏览器端运行轻量级模型，实现在云端大模型处理前的本地极速预检与隐私保护。
5. **多模态报告生成**：支持将审计结果导出为结构化的 Markdown 报告，或通过阿里云百炼文生图大模型，一键生成商务风格的可视化审计摘要图片。
6. **本地持久化与历史回溯**：基于 IndexedDB 实现无感知的会话持久化，刷新页面不丢数据，支持历史审阅记录秒级切换。

##  技术架构

- **前端框架**：Next.js 16 (App Router) + React + TypeScript
- **样式与 UI**：Tailwind CSS + Lucide Icons
- **状态管理**：Zustand (客户端状态) + TanStack Query (服务端状态)
- **本地存储**：idb-keyval (IndexedDB 持久化)
- **AI 能力集成**：
  - **云端大模型**：Vercel AI SDK + DeepSeek API (流式提取)
  - **端侧推理**：@xenova/transformers (Web Worker 运行)
  - **多模态生成**：阿里云百炼 (DashScope API 生图)
- **工程化**：ESLint + Prettier + TypeScript Strict 模式

##  快速开始

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/0qmp0/contract-audit-workbench.git
cd contract-audit-workbench
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件，填入你的 API 密钥：

```env
# DeepSeek API Key (用于核心条款提取)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 阿里云百炼 API Key (用于多模态生图)
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 启动开发服务器

```bash
pnpm dev
```

打开浏览器访问 http://localhost:3000 即可体验。

##  目录结构

```text
├─ app/                  # 路由与页面 (含 API 路由、Worker)
├─ components/           # 核心业务组件 (审计面板、字段卡片等)
├─ hooks/                # 自定义 Hooks (历史记录查询等)
├─ lib/                  # AI 封装、解析层、法务知识库、本地存储
├─ rules/                # 本地规则引擎 (金额、日期、违约等校验)
├─ stores/               # Zustand 全局状态管理
├─ types/                # TypeScript 类型定义
└─ dev/                  # 组件调试辅助资源
```

##  开发日志

### Day 1

- **完成**：Next.js 项目初始化，工程规范配置，目录结构、.env.example、Git 仓库建立。
- **问题**：pnpm 环境变量未配置；.gitignore 的 .env* 会误伤 .env.example，已加 !.env.example 例外。

### Day 2

- **完成**：三栏 UI 骨架与 9 个核心组件拆分，Zustand 最小 store 接入，TanStack Query mock 历史列表跑通。
- **问题**：第 4、5 批改动混在一起漏提交；app/dev/components/page.tsx 首次生成为 0 字节导致 build 报错，重写后修复。

### Day 3

- **完成**：封装 DeepSeek provider 与提取 Prompt；API 路由实现流式接口；前端通过 fetch + ReadableStream 消费 SSE，支持中断与错误兜底。
- **问题**：AI SDK 新版弃用旧方法，改用 createUIMessageStreamResponse；SDK 默认错误被掩盖，通过 onError 暴露真实错误。

### Day 4

- **完成**：实现 rules/ 规则引擎；编写 lib/parse-extraction.ts 将 AI 流式 JSON 转换为字段并验证引用；前端接入真实提取结果。
- **问题**：AI 返回的 source_ref 是字符串，需转换为对象并校验，若找不到对应原文则标记 needs-human。

### Day 5

- **完成**：核心状态迁移至 Zustand；使用 idb-keyval 实现 IndexedDB 持久化；新增 Markdown 报告导出；左侧面板增加自动定位高亮。
- **问题**：异步写入与列表查询存在时序差，通过延迟触发 refetch() 解决。

### Day 6

- **完成**：增加请求超时控制与首字延迟占位；新增 ErrorBoundary 拦截渲染异常；适配移动端视口与输入区折叠；集成动态 Prompt、本地法务知识库 RAG、Web Worker 端侧推理、百炼文生图。
- **问题**：区分手动中断与超时需使用 Ref 避免闭包陷阱；ESLint 严格模式要求 type-only import。


### Day 7
- 暂停开发，等待用户反馈与需求调整。