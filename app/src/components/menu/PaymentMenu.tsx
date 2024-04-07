import { Avatar, Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ArrowOutward, Cancel } from '@mui/icons-material';
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
      {payment.source && (
        <MenuItem
          {...(payment.source.ref && {
            component: 'a',
            href: payment.source.ref,
            target: '_blank'
          })}>
          <ListItemIcon>
            <Avatar
              src={`/dapps/${payment.source.app.toLowerCase()}.png`}
              sx={{ width: 20, height: 20 }}
            />
          </ListItemIcon>
          {payment.source.app}
          <ArrowOutward fontSize="small" sx={{ margin: 1 }} />
        </MenuItem>
      )}
      {payment.source && <Divider />}
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
