import { Avatar, Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { Cancel, OpenInNew, Receipt } from '@mui/icons-material';
import { cancelPayment } from '../../services/payments';
import { PaymentType } from '../../types/PaymentType';
import { toast } from 'react-toastify';
import { green } from '@mui/material/colors';

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
          <OpenInNew fontSize="small" sx={{ margin: 1 }} />
        </MenuItem>
      )}
      {payment.source && <Divider />}
      {payment.status === 'COMPLETED' ? (
        <MenuItem
          component="a"
          href={`https://www.onceupon.xyz/${payment.hash}`}
          target="_blank"
          sx={{ color: green.A700 }}>
          <ListItemIcon sx={{ color: green.A700 }}>
            <Receipt fontSize="small" />
          </ListItemIcon>
          Receipt
          <OpenInNew fontSize="small" sx={{ margin: 1 }} />
        </MenuItem>
      ) : (
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
      )}
    </Menu>
  );
}
