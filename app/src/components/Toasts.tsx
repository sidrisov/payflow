import Typography from '@mui/material/Typography';
import { toast } from 'react-toastify';

export const comingSoonText = 'Coming soon 🚀 ✨ 🙌🏻';
export const comingSoonToast = () => {
  toast(<Typography textAlign="center">{comingSoonText}</Typography>, {
    position: 'bottom-center'
  });
};
