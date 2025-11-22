import React from 'react';
import { Avatar, Link, LinkProps, Skeleton, Stack, Typography } from '@mui/material';
import { useMobile } from '../../utils/hooks/useMobile';
import { ActivityIcon, ActivityType } from './ActivityIcon';
import { usePaymentActivityDetails } from '../../utils/hooks/usePaymentAcitivityDetails';
import { PaymentType } from '@payflow/common';
import FarcasterAvatar from '../avatars/FarcasterAvatar';
import TokenNetworkAvatar from '../avatars/TokenNetworkAvatar';

interface PaymentDetailsProps {
  activity: ActivityType;
  payment: PaymentType;
}

interface BlockExplorerLinkProps extends Omit<LinkProps, 'href'> {
  blockExplorerUrl: string;
  txHash: string;
  children: React.ReactNode;
}

export const BlockExplorerLink: React.FC<BlockExplorerLinkProps> = ({
  blockExplorerUrl,
  txHash,
  children,
  ...linkProps
}) => {
  return (
    <Link
      href={`${blockExplorerUrl}/tx/${txHash}`}
      target="_blank"
      underline="hover"
      color="inherit"
      overflow="clip"
      textOverflow="ellipsis"
      {...linkProps}>
      {children}
    </Link>
  );
};

const ActivityWrapper: React.FC<{
  activity: ActivityType;
  children: React.ReactNode;
}> = ({ activity, children }) => (
  <Stack
    direction="row"
    spacing={0.5}
    alignItems="center"
    flexWrap="wrap"
    sx={{ textWrap: 'pretty' }}>
    <ActivityIcon activity={activity} />
    {children}
  </Stack>
);

export const PaymentDetails = ({ activity, payment }: PaymentDetailsProps) => {
  const isMobile = useMobile();
  const { token, formattedTokenAmount, formattedUsdAmount } =
    usePaymentActivityDetails(payment);

  const renderContent = () => {
    if (payment.category === 'fc_storage') {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
            {formattedTokenAmount} storage unit{formattedTokenAmount !== '1' ? 's' : ''}
          </Typography>
          <FarcasterAvatar size={15} />
        </Stack>
      );
    }

    // Default case (for regular payments and deprecated mint category)
    return (
      token && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
            {formattedTokenAmount} {token.name}
          </Typography>
          <TokenNetworkAvatar token={token} size={18} />
          <Typography
            variant="caption"
            fontWeight="bold"
            color="text.secondary"
            fontSize={isMobile ? 12 : 14}>
            ${formattedUsdAmount}
          </Typography>
        </Stack>
      )
    );
  };

  return <ActivityWrapper activity={activity}>{renderContent()}</ActivityWrapper>;
};
