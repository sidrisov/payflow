import Typography from '@mui/material/Typography';
import { toast, ToastOptions } from 'react-toastify';
import { PaymentStatus } from '../types/PaymentType';

export const comingSoonText = 'Coming soon 🚀 ✨ 🙌🏻';
export const comingSoonToast = () => {
  toast(<Typography textAlign="center">{comingSoonText}</Typography>);
};

export const statusToToastType: Record<PaymentStatus, ToastOptions['type']> = {
  COMPLETED: 'success',
  INPROGRESS: 'info',
  CANCELLED: 'warning',
  REFUNDED: 'warning',
  PENDING: 'info',
  PENDING_REFUND: 'info',
  EXPIRED: 'warning'
};
