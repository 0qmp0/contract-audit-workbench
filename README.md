This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Day 1
- 完成：Next.js 项目初始化，ESLint + Prettier + TypeScript strict 配置，目录结构、`.env.example`、README 骨架、Git 仓库建立并推送。
- 问题：pnpm 环境变量未配置，改用 npx 临时方案后修复；`.gitignore` 的 `.env*` 会误伤 `.env.example`，已加 `!.env.example` 例外。
- 明天优先：三栏工作台 UI 骨架与核心组件拆分。

### Day 2
- 完成：三栏 UI 骨架与 9 个核心组件拆分，Zustand 最小 store 接入，TanStack Query mock 历史列表跑通加载/错误/空状态，新增 `/dev/components` 组件集中页，变体拆到 `dev/components/`。
- 问题：第 4、5 批改动混在一起漏提交；`app/dev/components/page.tsx` 首次生成为 0 字节导致 build 报 `is not a module`，重写内容后修复。
- 明天优先：`lib/ai.ts` 封装 + `/api/extract` 流式提取，打通“粘贴文本 → 流式字段流入”。

### Day 3
- 完成：`lib/ai.ts` 封装 DeepSeek provider 与提取 Prompt，`/api/extract` 流式接口，前端 fetch + ReadableStream 消费 SSE，支持中断与错误兜底。
- 问题：AI SDK 新版弃用 `toTextStreamResponse` / `toUIMessageStreamResponse`，改用 `createUIMessageStreamResponse` + `toUIMessageStream`；默认错误被掩盖成 "An error occurred."，通过 `onError` 暴露真实错误后验证 401 能正确显示。
- 明天优先：规则引擎与三重审计数据结构，把流式原始文本解析成字段卡片并挂规则判定。

### Day 4
- 完成：实现 `rules/` 规则引擎（金额、期限、主体、争议等 5 类规则及三档判定）；编写 `lib/parse-extraction.ts` 将 AI 流式 JSON 转换为 `ExtractedField` 并验证引用（RAG 幻觉拦截）；前端接入真实提取结果。
- 问题：AI 返回的 `source_ref` 是字符串而非 `SourceRef` 对象，需通过 `indexOf` 转换为 `{ start, end, snippet }`；若找不到对应原文，设为 `null` 并标记 `needs-human`。
- 明天优先：持久化与三栏状态提升，实现刷新不丢、历史切换、报告导出。

### Day 5
- 完成：核心状态（`sourceText`、`extractedFields`）迁移至 Zustand；使用 `idb-keyval` 实现 IndexedDB 持久化，支持刷新恢复与历史会话切换；新增 Markdown 格式审阅报告导出功能；`SourcePanel` 增加 `scrollIntoView` 自动定位高亮。
- 问题：异步写入 IndexedDB 与 TanStack Query 的历史列表刷新存在时序差，通过 `setTimeout` 延迟 300ms 触发 `refetch()` 解决。
- 明天优先：体验打磨、错误边界与移动端适配。

### Day 6
- 完成：增加 30 秒请求超时控制；首字延迟时展示“正在读取协议…”占位；新增 `ErrorBoundary` 组件拦截渲染异常，防止局部报错导致全屏白屏；适配移动端视口（`h-dvh`），支持移动端折叠输入区。
- 问题：`catch` 块中无法通过 `streamError` 状态区分手动中断与超时，引入 `isManualAbortRef` 解决闭包陷阱；ESLint 严格模式要求 `type-only import`。
- 明天优先：完善 README、撰写技术文档、录制 5-8 分钟演示视频，准备最终提交。