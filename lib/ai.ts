import { deepseek } from '@ai-sdk/deepseek';

// 统一 Prompt：动态识别合同类型并提取原文中真实存在的关键条款，禁止编造
export const EXTRACTION_SYSTEM_PROMPT = `你是一个合同条款提取助手。你的任务是从用户提供的协议原文中提取关键字段。

规则：
1. 只基于原文提取，不要使用任何外部知识。
2. 只输出原文中确实存在的条款；没有约定的字段直接忽略，不要编造，也不要填“原文未提及”。
3. 禁止编造、推测或补全原文中没有的内容。
4. 每条字段必须附带原文中的确切完整句子作为 source_ref，用于定位。
5. 输出必须是合法的 JSON 数组，每个对象包含 name、aiValue、confidence（0-1）、source_ref。不要包含任何 JSON 之外的文字或 Markdown 代码块。`;

export const EXTRACTION_USER_PROMPT_TEMPLATE = (sourceText: string) => `
请作为专业的法务助理，阅读以下协议原文，并提取出最重要的 3 到 5 个关键条款字段。
你可以提取的字段包括但不限于：付款方式、交付期限、违约责任、保密义务、争议解决、合同金额、合作范围等。
规则：
1. 提取的字段名要精炼（例如“付款方式”、“违约金比例”）。
2. 如果某项关键条款在原文中确实没有约定，不要编造，直接忽略该字段。
3. 只基于原文提取，不要使用任何外部知识。
4. 每条字段必须附带原文中的确切完整句子作为 source_ref，用于精确定位。
5. 输出必须是合法的 JSON 数组，不要包含任何 Markdown 代码块标记（如 \`\`\`json），直接输出数组。

协议原文：
"""
${sourceText}
"""
`;

// 统一模型实例，Day 3 先用 deepseek-chat
export const extractionModel = deepseek('deepseek-chat');
