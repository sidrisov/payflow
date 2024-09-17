import { IdentityType } from '../../types/ProfileType';
import ArrowUpwardIcon from '@mui/icons-material/NorthEast';
import ArrowDownwardIcon from '@mui/icons-material/SouthEast';
import { green, red } from '@mui/material/colors';
import { PaymentType } from '../../types/PaymentType';

export function getActivityType(identity: IdentityType, payment: PaymentType) {
  const isSelfTransaction =
    (payment.senderAddress &&
      payment.receiverAddress &&
      payment.senderAddress === payment.receiverAddress) ||
    (payment.sender?.identity &&
      payment.receiver?.identity &&
      payment.sender.identity === payment.receiver.identity);

  const isOutbound =
    (payment.sender?.identity &&
      identity.address &&
      payment.sender.identity === identity.address) ||
    (payment.senderAddress && identity.address && payment.senderAddress === identity.address);

  return isSelfTransaction ? 'self' : isOutbound ? 'outbound' : 'inbound';
}

export function getActivityName(identity: IdentityType, payment: PaymentType): string {
  const activityType = getActivityType(identity, payment);

  if (activityType === 'self') {
    if (payment.category === 'fc_storage') {
      return 'bought storage';
    } else if (payment.category === 'mint') {
      return 'minted collectible';
    }
    return 'moved funds';
  }

  if (payment.category) {
    return 'gifted ' + (payment.category === 'mint' ? 'collectible' : 'storage');
  } else {
    return 'paid';
  }
}

export const ActivityIcon = ({
  identity,
  payment
}: {
  identity: IdentityType;
  payment: PaymentType;
}) => {
  const activity = getActivityType(identity, payment);

  switch (activity) {
    case 'self':
      return <></>;
    case 'inbound':
      return <ArrowDownwardIcon sx={{ color: green.A700 }} />;
    default:
      return <ArrowUpwardIcon sx={{ color: red.A400 }} />;
  }
};
