import { toast } from 'react-toastify';

export function copyToClipboard(content: string | undefined, copySuccessText?: string) {
  try {
    if (content && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      toast.success(copySuccessText || 'Copied!');
    }
  } catch (error) {
    alert(error);
  }
}
