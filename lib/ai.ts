import { deepseek } from '@ai-sdk/deepseek';

// 统一 Prompt：只基于原文提取，找不到返回“原文未提及”，禁止编造
export const EXTRACTION_SYSTEM_PROMPT = `你是一个合同条款提取助手。你的任务是从用户提供的协议原文中提取关键字段。

规则：
1. 只基于原文提取，不要使用任何外部知识。
2. 如果原文中找不到某个字段的信息，该字段的 aiValue 必须返回“原文未提及”。
3. 禁止编造、推测或补全原文中没有的内容。
4. 每条字段必须附带原文中的确切片段作为 source_ref，用于定位。
5. 输出必须是合法的 JSON 数组，不要包含任何 JSON 之外的文字。`;

export const EXTRACTION_USER_PROMPT_TEMPLATE = (sourceText: string) => `
请从以下协议原文中提取字段，输出 JSON 数组，每个对象包含 name、aiValue、confidence（0-1）、source_ref（原文片段）：

协议原文：
"""
${sourceText}
"""

需要提取的字段：预付款比例、交付开始时间、争议解决方式。
`;

// 统一模型实例，Day 3 先用 deepseek-chat
export const extractionModel = deepseek('deepseek-chat');