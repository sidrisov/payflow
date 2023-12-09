export function isAlphanumericPlusFewSpecialChars(str: string) {
  return /^[a-zA-Z0-9_-]+$/.test(str);
}
