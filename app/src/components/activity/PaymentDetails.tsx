import React from 'react';
import { Avatar, Link, LinkProps, Skeleton, Stack, Typography } from '@mui/material';
import { useMobile } from '../../utils/hooks/useMobile';
import TokenAvatar from '../avatars/TokenAvatar';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { ActivityIcon, ActivityType } from './ActivityIcon';
import { usePaymentActivityDetails } from '../../utils/hooks/usePaymentAcitivityDetails';
import { PaymentType } from '../../types/PaymentType';
import FarcasterAvatar from '../avatars/FarcasterAvatar';
import MoxieAvatar from '../avatars/MoxieAvatar';
import { secondsToTimeUnit } from '../../utils/time';

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
  const {
    token,
    formattedTokenAmount,
    formattedUsdAmount,
    defaultBlockExplorerUrl,
    mintData,
    hypersubData
  } = usePaymentActivityDetails(payment);

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

    if (payment.category === 'fan') {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
            {formattedTokenAmount} {payment.token.split(';')[0]} fan token(s)
          </Typography>
          <MoxieAvatar size={15} />
        </Stack>
      );
    }

    if (payment.category === 'mint') {
      if (mintData === undefined) {
        return (
          <>
            <Skeleton variant="rounded" width={25} height={25} />
            <Skeleton variant="text" width={120} />
          </>
        );
      }

      if (mintData) {
        const mintCount = payment.tokenAmount || 1;
        return (
          <>
            {mintCount > 1 && (
              <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14} ml={1}>
                {mintCount}x
              </Typography>
            )}
            <Avatar
              variant="rounded"
              src={mintData.metadata.image}
              sx={{ width: 35, height: 35 }}
            />
            <Typography
              noWrap
              maxWidth={180}
              variant="caption"
              fontWeight="bold"
              fontSize={isMobile ? 12 : 14}
              textOverflow="ellipsis"
              overflow="hidden">
              {mintData.metadata.name}
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                textOverflow="ellipsis"
                overflow="hidden">
                {mintData.collectionName}
              </Typography>
            </Typography>
          </>
        );
      }
    }

    if (payment.category === 'hypersub') {
      if (hypersubData === undefined) {
        return (
          <>
            <Skeleton variant="rounded" width={25} height={25} />
            <Skeleton variant="text" width={120} />
          </>
        );
      }

      if (hypersubData) {
        const mintCount = payment.tokenAmount || 1;
        return (
          <>
            <Avatar
              variant="rounded"
              src={hypersubData.metadata?.image}
              sx={{ width: 35, height: 35 }}
            />
            <Typography
              noWrap
              maxWidth={180}
              variant="caption"
              fontWeight="bold"
              fontSize={isMobile ? 12 : 14}
              textOverflow="ellipsis"
              overflow="hidden">
              {hypersubData.state.name}
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                textOverflow="ellipsis"
                overflow="hidden">
                subscription: {payment.tokenAmount}{' '}
                {secondsToTimeUnit(hypersubData.state.tier1.params.periodDurationSeconds).timeUnit}
              </Typography>
            </Typography>
          </>
        );
      }
    }

    // Default case (for regular payments)
    return (
      <>
        <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
          {formattedTokenAmount} {token!.name}
        </Typography>
        <TokenAvatar token={token!} sx={{ width: 15, height: 15 }} />
        <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
          ${formattedUsdAmount}
        </Typography>
        <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
          on
        </Typography>
        <NetworkAvatar chainId={payment.chainId} sx={{ width: 15, height: 15 }} />
      </>
    );
  };

  const content = <ActivityWrapper activity={activity}>{renderContent()}</ActivityWrapper>;

  return defaultBlockExplorerUrl && payment.hash ? (
    <BlockExplorerLink blockExplorerUrl={defaultBlockExplorerUrl} txHash={payment.hash}>
      {content}
    </BlockExplorerLink>
  ) : (
    content
  );
};
