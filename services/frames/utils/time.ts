export function addTimestampToUrl(url: string): string {
  const timestamp = Math.floor(new Date().getTime() / (60 * 1000)) * (60 * 1000); // Round down to the nearest minute
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${timestamp}`;
}
