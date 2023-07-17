export function copyToClipboard(content: string | undefined) {
  try {
    if (content && navigator.clipboard) {
      navigator.clipboard.writeText(content);
    }
  } catch (error) {
    alert(error);
  }
}
