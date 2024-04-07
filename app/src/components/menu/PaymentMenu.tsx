import { ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { cancelPayment } from '../../services/payments';
import { PaymentType } from '../../types/PaymentType';
import { toast } from 'react-toastify';

export function PaymentMenu({ payment, ...props }: MenuProps & { payment: PaymentType }) {
  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      style={{ borderRadius: '50px' }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuItem
        onClick={async () => {
          const success = await cancelPayment(payment);
          if (success) {
            toast.success('Payment cancelled!');
          } else {
            toast.error('Payment cancellation failed!');
          }
        }}
        sx={{ color: 'red' }}>
        <ListItemIcon sx={{ color: 'red' }}>
          <Cancel fontSize="small" />
        </ListItemIcon>
        Cancel
      </MenuItem>
    </Menu>
  );
}
