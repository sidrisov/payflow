export function normalizeNumberPrecision(value: number) {
  if (value === 0) {
    return '0.0';
  }

  if (value > 1) {
    return value.toFixed(1);
  } else {
    return value.toPrecision(3);
  }
}

export function formatAmountWithSuffix(amountStr: string): string {
  const amount = parseFloat(amountStr);

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}m`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  } else {
    return amount.toString();
  }
}
