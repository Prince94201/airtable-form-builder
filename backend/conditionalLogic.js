export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const evaluateCondition = (condition) => {
    const { questionKey, operator, value } = condition;
    const answer = answersSoFar[questionKey];

    if (answer === undefined || answer === null) {
      return false;
    }

    switch (operator) {
      case 'equals':
        return answer === value;
      case 'notEquals':
        return answer !== value;
      case 'contains':
        if (typeof answer === 'string') {
          return answer.toLowerCase().includes(String(value).toLowerCase());
        }
        if (Array.isArray(answer)) {
          return answer.includes(value);
        }
        return false;
      default:
        return false;
    }
  };

  const results = rules.conditions.map(evaluateCondition);

  if (rules.logic === 'AND') {
    return results.every(result => result === true);
  } else if (rules.logic === 'OR') {
    return results.some(result => result === true);
  }

  return true;
}