export function copyToClipboard(content: string | undefined) {
  if (content && window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content);
  }
}
