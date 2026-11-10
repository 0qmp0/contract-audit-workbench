import type { Rule, RuleContext, RuleResult } from './types';

const pass = (ruleId: string, reason: string): RuleResult => ({ level: 'pass', ruleId, reason });
const warning = (ruleId: string, reason: string, suggestion?: string): RuleResult => ({
  level: 'warning',
  ruleId,
  reason,
  suggestion,
});
const blocked = (ruleId: string, reason: string, suggestion?: string): RuleResult => ({
  level: 'blocked',
  ruleId,
  reason,
  suggestion,
});

// 金额/比例格式：数字 + 可选 % / 元 / 万元
const AMOUNT_PATTERN = /^\s*\d+(\.\d+)?\s*(%|元|万元|美元|人民币)?\s*$/;

export const amountRule: Rule = {
  id: 'AMOUNT_PATTERN',
  name: '金额/比例格式',
  appliesTo: ['比例', '金额', '价款', '费用', '违约金'],
  evaluate: ({ aiValue }: RuleContext) => {
    if (aiValue === '原文未提及')
      return warning('AMOUNT_PATTERN', '原文未提及金额，建议人工核对。');
    if (AMOUNT_PATTERN.test(aiValue))
      return pass('AMOUNT_PATTERN', '金额与比例格式可解析，符合数字模式规则。');
    return blocked(
      'AMOUNT_PATTERN',
      '金额格式无法解析。',
      '建议人工核对，确认是否缺少单位或数字。',
    );
  },
};

// 期限可解析：必须能被 Date 解析，或明确是数字+天/日/月/年
const DURATION_PATTERN = /^\s*\d+\s*(天|日|个工作日|个月|月|年)\s*$/;
const DATE_PARSEABLE = (value: string) => !Number.isNaN(Date.parse(value));

export const dateRule: Rule = {
  id: 'DATE_PARSEABLE',
  name: '期限可解析',
  appliesTo: ['期限', '时间', '日期', '交付', '付款'],
  evaluate: ({ aiValue }: RuleContext) => {
    if (aiValue === '原文未提及')
      return warning('DATE_PARSEABLE', '原文未提及期限，建议人工核对。');
    if (DURATION_PATTERN.test(aiValue) || DATE_PARSEABLE(aiValue)) {
      return pass('DATE_PARSEABLE', '期限可解析为明确时长或日期。');
    }
    return blocked(
      'DATE_PARSEABLE',
      `期限表述「${aiValue}」无法解析为明确日期。`,
      '建议人工核对，要求双方约定具体日期。',
    );
  },
};

// 责任主体非空且有指代
export const responsiblePartyRule: Rule = {
  id: 'RESPONSIBLE_PARTY',
  name: '责任主体非空',
  appliesTo: ['主体', '甲方', '乙方', '责任方'],
  evaluate: ({ aiValue }: RuleContext) => {
    if (aiValue === '原文未提及' || !aiValue.trim()) {
      return blocked(
        'RESPONSIBLE_PARTY',
        '责任主体为空或原文未提及。',
        '建议人工核对，补全责任主体。',
      );
    }
    return pass('RESPONSIBLE_PARTY', '责任主体非空。');
  },
};

// 争议解决方式枚举
const DISPUTE_ENUM = ['诉讼', '仲裁', '协商', '调解'];

export const disputeRule: Rule = {
  id: 'DISPUTE_ENUM',
  name: '争议解决方式枚举',
  appliesTo: ['争议', '纠纷'],
  evaluate: ({ aiValue }: RuleContext) => {
    if (aiValue === '原文未提及') {
      return warning('DISPUTE_ENUM', '原文未提及争议解决方式，建议人工核对。');
    }
    const matched = DISPUTE_ENUM.some((keyword) => aiValue.includes(keyword));
    if (matched) return pass('DISPUTE_ENUM', '争议解决方式在预设枚举内。');
    return warning(
      'DISPUTE_ENUM',
      '争议解决方式不在预设枚举内，需人工确认是否接受。',
      '建议确认管辖法院或仲裁机构是否对双方公平。',
    );
  },
};

// 违约条件非空
export const breachClauseRule: Rule = {
  id: 'BREACH_CLAUSE',
  name: '违约条件非空',
  appliesTo: ['违约'],
  evaluate: ({ aiValue }: RuleContext) => {
    if (aiValue === '原文未提及' || aiValue.trim().length < 4) {
      return warning(
        'BREACH_CLAUSE',
        '违约条件描述过短或原文未提及。',
        '建议人工核对违约条款是否完整。',
      );
    }
    return pass('BREACH_CLAUSE', '违约条件非空且有描述。');
  },
};

export const allRules: Rule[] = [
  amountRule,
  dateRule,
  responsiblePartyRule,
  disputeRule,
  breachClauseRule,
];
