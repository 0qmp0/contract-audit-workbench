import { describe, expect, it } from 'vitest';
import { evaluateField } from '../engine';
import type { ExtractedField } from '@/types/field';

const makeField = (name: string, aiValue: string): ExtractedField => ({
  id: name,
  name,
  aiValue,
  ruleResult: { level: 'pass', ruleId: 'TBD', reason: 'TBD' },
  sourceRef: null,
  reviewStatus: 'pending',
});

describe('规则引擎', () => {
  it('金额格式合法 → pass', () => {
    const result = evaluateField(makeField('预付款比例', '40%'), '');
    expect(result.level).toBe('pass');
    expect(result.ruleId).toBe('AMOUNT_PATTERN');
  });

  it('期限“尽快” → blocked', () => {
    const result = evaluateField(makeField('交付开始时间', '尽快'), '');
    expect(result.level).toBe('blocked');
    expect(result.ruleId).toBe('DATE_PARSEABLE');
  });

  it('争议方式不在枚举 → warning', () => {
    const result = evaluateField(makeField('争议解决方式', '提交乙方所在地人民法院诉讼解决'), '');
    expect(result.level).toBe('warning');
  });

  it('未匹配规则 → warning + NO_RULE', () => {
    const result = evaluateField(makeField('无关字段', 'x'), '');
    expect(result.level).toBe('warning');
    expect(result.ruleId).toBe('NO_RULE');
  });
});