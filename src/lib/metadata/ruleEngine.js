const operators = {
  '==': (left, right) => left == right,
  '===': (left, right) => left === right,
  '!=': (left, right) => left != right,
  '>': (left, right) => Number(left) > Number(right),
  '>=': (left, right) => Number(left) >= Number(right),
  '<': (left, right) => Number(left) < Number(right),
  '<=': (left, right) => Number(left) <= Number(right),
  includes: (left, right) => Array.isArray(left) && left.includes(right),
  contains: (left, right) => String(left ?? '').toLowerCase().includes(String(right ?? '').toLowerCase()),
  isEmpty: (left) => left === null || left === undefined || left === '',
  notEmpty: (left) => !(left === null || left === undefined || left === ''),
};

export function evaluateCondition(record, condition) {
  const left = record?.[condition.field];
  const operation = operators[condition.operator];
  if (!operation) return false;
  return condition.operator === 'isEmpty' || condition.operator === 'notEmpty'
    ? operation(left)
    : operation(left, condition.value);
}

export function evaluateRule(record, rule) {
  if (!rule?.active) return { matched: false, actions: [] };
  const matched = (rule.conditions || []).every((condition) => evaluateCondition(record, condition));
  return { matched, actions: matched ? rule.actions || [] : [] };
}

export function evaluateRules(record, rules = []) {
  const effects = [];
  rules.forEach((rule) => {
    const result = evaluateRule(record, rule);
    if (result.matched) {
      effects.push({ ruleId: rule.id, ruleName: rule.name, actions: result.actions });
    }
  });
  return effects;
}
