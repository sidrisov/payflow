import { IdentityType, PaymentType } from '@payflow/common';
import ArrowUpwardIcon from '@mui/icons-material/NorthEast';
import ArrowDownwardIcon from '@mui/icons-material/SouthEast';
import { green, red } from '@mui/material/colors';
import { Social } from '../../generated/graphql/types';

export type ActivityType = 'self' | 'inbound' | 'outbound';

export function getActivityType(
  identity: IdentityType,
  payment: PaymentType,
  senderSocial?: Social,
  receiverSocial?: Social
) {
  const isSelfTransaction =
    (payment.senderAddress &&
      payment.receiverAddress &&
      payment.senderAddress === payment.receiverAddress) ||
    (payment.sender?.identity &&
      payment.receiver?.identity &&
      payment.sender.identity === payment.receiver.identity) ||
    (senderSocial && receiverSocial && senderSocial.userId === receiverSocial.userId);

  const isOutbound =
    (payment.sender?.identity &&
      identity.address &&
      payment.sender.identity === identity.address) ||
    (payment.senderAddress && identity.address && payment.senderAddress === identity.address);

  return isSelfTransaction ? 'self' : isOutbound ? 'outbound' : 'inbound';
}

export function getActivityName(activity: ActivityType, payment: PaymentType): string {
  if (activity === 'self') {
    if (
      payment.category === 'fc_storage' ||
      payment.category === 'fan' ||
      payment.category === 'hypersub'
    ) {
      return 'bought';
    } else if (payment.category === 'mint') {
      return 'minted';
    }
    return 'moved funds';
  }

  if (payment.category?.startsWith('reward')) {
    return 'rewarded';
  } else if (payment.category) {
    return 'gifted';
  } else {
    return 'paid';
  }
}

export const ActivityIcon = ({ activity }: { activity: ActivityType }) => {
  switch (activity) {
    case 'self':
      return <></>;
    case 'inbound':
      return <ArrowDownwardIcon sx={{ color: green.A700 }} />;
    default:
      return <ArrowUpwardIcon sx={{ color: red.A400 }} />;
  }
};
