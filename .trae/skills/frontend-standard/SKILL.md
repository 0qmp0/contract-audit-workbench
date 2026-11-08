# 前端项目规范
## 技术栈
- Next.js 16.4.5 App Router + React + TypeScript strict
- Tailwind CSS（不写内联样式）
- Zustand / TanStack Query

## 组件规范
- 函数式组件，Props 用 interface 定义并导出
- 组件放在 components/组件名/index.tsx
- 事件处理命名：on + 动作，如 onFieldSelect
- 所有组件必须通过 ESLint + Prettier + tsc

## 禁止事项
- 不要修改 stores/ 和 types/ 下的已有接口
- 不要引入新的依赖，除非明确说明在 README.md 中
- 不要修改 .gitignore 中的文件
- 不要修改 .env.example 中的文件