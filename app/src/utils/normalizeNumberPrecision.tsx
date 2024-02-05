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
