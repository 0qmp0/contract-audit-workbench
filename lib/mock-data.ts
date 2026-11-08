import type { ExtractedField } from '@/types/field';

export const mockSourceText = `甲方应在合同签订后 30 日内向乙方支付合同总价款的 40% 作为预付款。
乙方应在收到预付款后尽快开始项目交付。
若甲方逾期付款，应按日万分之五向乙方支付违约金。
因本合同引起的争议，双方应友好协商解决；协商不成的，提交乙方所在地人民法院诉讼解决。`;

export const mockFields: ExtractedField[] = [
  {
    id: 'payment-ratio',
    name: '预付款比例',
    aiValue: '40%',
    confidence: 0.92,
    ruleResult: {
      level: 'pass',
      ruleId: 'AMOUNT_PATTERN',
      reason: '金额与比例格式可解析，符合数字模式规则。',
    },
    sourceRef: {
      start: 0,
      end: 38,
      snippet: '甲方应在合同签订后 30 日内向乙方支付合同总价款的 40% 作为预付款。',
    },
    reviewStatus: 'pending',
  },
  {
    id: 'delivery-time',
    name: '交付开始时间',
    aiValue: '尽快',
    confidence: 0.61,
    ruleResult: {
      level: 'blocked',
      ruleId: 'DATE_PARSEABLE',
      reason: '期限表述为“尽快”，无法解析为明确日期。',
      suggestion: '建议人工核对，要求双方约定具体日期。',
    },
    sourceRef: {
      start: 39,
      end: 59,
      snippet: '乙方应在收到预付款后尽快开始项目交付。',
    },
    reviewStatus: 'needs-human',
  },
  {
    id: 'dispute-resolution',
    name: '争议解决方式',
    aiValue: '提交乙方所在地人民法院诉讼解决',
    confidence: 0.88,
    ruleResult: {
      level: 'warning',
      ruleId: 'DISPUTE_ENUM',
      reason: '争议解决方式不在预设枚举内，需人工确认是否接受。',
      suggestion: '建议确认管辖法院是否对甲方公平。',
    },
    sourceRef: null,
    reviewStatus: 'pending',
  },
];