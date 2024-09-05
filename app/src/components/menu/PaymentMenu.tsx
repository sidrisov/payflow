import { Avatar, ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { Cancel, OpenInNew } from '@mui/icons-material';
import { cancelPayment } from '../../services/payments';
import { PaymentType } from '../../types/PaymentType';
import { toast } from 'react-toastify';
import { green } from '@mui/material/colors';
import { IoCheckmarkDoneCircle } from 'react-icons/io5';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import { TbProgressCheck } from 'react-icons/tb';
import { getReceiptUrl } from '../../utils/receipts';
import { FaTag } from 'react-icons/fa6';

function getDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Invalid URL:', url);
    return url; // Return the original string if it's not a valid URL
  }
}

export function PaymentMenu({ payment, ...props }: MenuProps & { payment: PaymentType }) {
  const targetDomain = payment.target ? getDomainFromUrl(payment.target) : '';

  return (
    <Menu
      {...props}
      sx={{ '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        {payment.source && payment.source.app && (
          <>
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
              <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
            </MenuItem>
          </>
        )}
        {payment.target && (
          <>
            <MenuItem component="a" href={payment.target} target="_blank">
              <ListItemIcon>
                <FaTag size={20} />
              </ListItemIcon>
              {`View on ${targetDomain}`}
              <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
            </MenuItem>
          </>
        )}
        {payment.status === 'COMPLETED' ? (
          <>
            <MenuItem
              component="a"
              href={getReceiptUrl(payment, false)}
              target="_blank"
              sx={{ color: green.A700 }}>
              <ListItemIcon sx={{ color: green.A700 }}>
                <IoIosCheckmarkCircle size={20} />
              </ListItemIcon>
              Receipt
              <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
            </MenuItem>
            {payment.fulfillmentHash && (
              <MenuItem
                component="a"
                href={getReceiptUrl(payment, true)}
                target="_blank"
                sx={{ color: green.A700 }}>
                <ListItemIcon sx={{ color: green.A700 }}>
                  <IoCheckmarkDoneCircle size={20} />
                </ListItemIcon>
                Fulfilled
                <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
              </MenuItem>
            )}
          </>
        ) : (
          <>
            {payment.status === 'INPROGRESS' && payment.fulfillmentId && (
              <MenuItem
                component="a"
                href={`https://explorer.paywithglide.xyz/?session_id=${payment.fulfillmentId}`}
                target="_blank">
                <ListItemIcon>
                  <TbProgressCheck size={20} />
                </ListItemIcon>
                Progress
                <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
              </MenuItem>
            )}
            <MenuItem
              disabled={payment.status === 'INPROGRESS'}
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
          </>
        )}
      </MenuList>
    </Menu>
  );
}
