import {
  Avatar,
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Typography
} from '@mui/material';
import { Cancel, OpenInNew, Receipt, Paid } from '@mui/icons-material';
import { cancelPayment } from '../../services/payments';
import { PaymentType } from '../../types/PaymentType';
import { toast } from 'react-toastify';
import { green } from '@mui/material/colors';
import { TbProgressCheck } from 'react-icons/tb';
import { getReceiptUrl } from '../../utils/receipts';
import { FaTag } from 'react-icons/fa6';
import { fanTokenUrl } from '../../utils/moxie';

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
  const sourceDomain = payment.source?.ref ? getDomainFromUrl(payment.source.ref) : '';

  return (
    <Menu
      {...props}
      sx={{ '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        {payment.source && payment.source.app && (
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
            <Typography variant="body2">
              Payment Source
              <Typography variant="caption" display="block" color="text.secondary">
                {sourceDomain || payment.source.app}
              </Typography>
            </Typography>
            <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
          </MenuItem>
        )}
        {payment.target && (
          <MenuItem component="a" href={payment.target} target="_blank">
            <ListItemIcon>
              <FaTag size={20} />
            </ListItemIcon>
            <Typography variant="body2">
              {payment.category === 'mint' ? 'Mint Collection' : `View on ${targetDomain}`}
              <Typography variant="caption" display="block" color="text.secondary">
                {targetDomain}
              </Typography>
            </Typography>
            <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
          </MenuItem>
        )}

        {payment.category === 'fan' && (
          <MenuItem component="a" href={fanTokenUrl(payment.token.split(';')[0])} target="_blank">
            <ListItemIcon>
              <FaTag size={20} />
            </ListItemIcon>
            <Typography variant="body2">
              Fan Token
              <Typography variant="caption" display="block" color="text.secondary">
                {payment.token.split(';')[0]}
              </Typography>
            </Typography>
            <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
          </MenuItem>
        )}

        {payment.status === 'COMPLETED' ? (
          <>
            <MenuItem
              component="a"
              href={getReceiptUrl(payment, false)}
              target="_blank"
              sx={{ color: green.A700 }}>
              <ListItemIcon sx={{ color: green.A700 }}>
                <Receipt />
              </ListItemIcon>
              <Typography variant="body2">
                Payment Receipt
                <Typography variant="caption" display="block" color="text.secondary">
                  Original payment transaction
                </Typography>
              </Typography>
              <OpenInNew fontSize="small" sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
            </MenuItem>
            {payment.fulfillmentHash && (
              <MenuItem
                component="a"
                href={getReceiptUrl(payment, true)}
                target="_blank"
                sx={{ color: green.A700 }}>
                <ListItemIcon sx={{ color: green.A700 }}>
                  <Paid />
                </ListItemIcon>
                <Typography variant="body2">
                  Fulfillment Receipt
                  <Typography variant="caption" display="block" color="text.secondary">
                    Cross-chain settlement transaction
                  </Typography>
                </Typography>
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
