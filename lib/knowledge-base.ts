export const LEGAL_KNOWLEDGE = [
  { keywords: ['预付款', '首付'], rule: '法务提示：预付款比例通常建议不超过 30%，以降低资金占用风险。' },
  { keywords: ['违约金', '逾期'], rule: '法务提示：违约金按日万分之五计算，折算年化约 18.25%，建议确认是否超过合同总额的 30%。' },
  { keywords: ['争议', '诉讼', '仲裁'], rule: '法务提示：争议解决管辖地通常建议选择原告所在地或合同履行地法院，以平衡双方权益。' }
];

export function getKnowledgeContext(fieldName: string): string | null {
  const matched = LEGAL_KNOWLEDGE.find(item => item.keywords.some(kw => fieldName.includes(kw)));
  return matched ? matched.rule : null;
}
