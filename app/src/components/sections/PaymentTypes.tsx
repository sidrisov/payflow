import React from 'react';
import { Avatar, BoxProps, Skeleton, Stack, Typography, styled } from '@mui/material';
import { PaymentType } from '../../types/PaymentType';
import { useSocialData } from '../../utils/hooks/useSocials';
import { FarcasterProfileSection } from '../FarcasterProfileSection';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';
import TokenAvatar from '../avatars/TokenAvatar';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { getNetworkDisplayName } from '../../utils/networks';
import getTokenName, { ERC20_CONTRACTS, Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { grey } from '@mui/material/colors';
import { useDarkMode } from '../../utils/hooks/useDarkMode';
import { useMobile } from '../../utils/hooks/useMobile';
import { PaymentCard } from '../cards/PaymentCard';
import { useMintData } from '../../utils/hooks/useMintData';

const StyledTypography = styled(Typography)(() => ({
  textAlign: 'start',
  variant: 'subtitle2',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  wordBreak: 'break-word'
}));

interface PaymentContentProps {
  children: React.ReactNode;
  loading: boolean;
}

function PaymentContent({ children, loading }: PaymentContentProps) {
  return loading ? (
    <Skeleton variant="rounded" sx={{ width: '100%', height: '100%' }} />
  ) : (
    <>{children}</>
  );
}

export function GiftStoragePayment({ payment, ...props }: BoxProps & { payment: PaymentType }) {
  const isMobile = useMobile();
  const { social, loading } = useSocialData(payment.receiverFid?.toString());
  const numberOfUnits = payment.tokenAmount ?? 1;

  return (
    <PaymentCard payment={payment} title="Buy Storage" {...props}>
      <PaymentContent loading={loading}>
        {social && (
          <>
            <FarcasterProfileSection social={social} />
            <Typography
              textAlign="start"
              variant="subtitle2"
              fontWeight="bold"
              fontSize={isMobile ? 12 : 13}>
              {numberOfUnits} Unit{numberOfUnits > 1 ? 's' : ''} of Storage
            </Typography>
          </>
        )}
      </PaymentContent>
    </PaymentCard>
  );
}

export function MintPayment({ payment, ...props }: BoxProps & { payment: PaymentType }) {
  const { social, loading: loadingSocials } = useSocialData(payment.receiverFid?.toString());
  const { mintData, loading: loadingMintData } = useMintData(payment);
  const isMobile = useMobile();
  const prefersDarkMode = useDarkMode();

  return (
    <PaymentCard payment={payment} title="Mint" {...props}>
      <PaymentContent loading={loadingSocials || loadingMintData}>
        {social && mintData && (
          <>
            <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={0.5}>
              <Avatar
                variant="rounded"
                src={mintData.metadata.image}
                sx={{ width: 40, height: 40 }}
              />
              <StyledTypography>{mintData.metadata.name}</StyledTypography>
            </Stack>
            <Typography
              textAlign="start"
              variant="caption"
              fontWeight="bold"
              color={grey[prefersDarkMode ? 400 : 700]}
              fontSize={isMobile ? 12 : 13}
              sx={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 2,
                wordBreak: 'break-all'
              }}>
              {mintData.collectionName}
            </Typography>
          </>
        )}
      </PaymentContent>
    </PaymentCard>
  );
}

export function GenericPayment({ payment, ...props }: BoxProps & { payment: PaymentType }) {
  const token = ERC20_CONTRACTS.find(
    (t) => t.chainId === payment.chainId && t.id === payment.token
  );
  const isMobile = useMobile();
  const { social } = useSocialData(undefined, payment.receiverAddress);

  const getPaymentTitle = () => {
    switch (payment.category) {
      case 'fc_storage':
        return 'Buy Storage';
      case 'mint':
        return 'Mint';
      default:
        return payment.category || payment.type === 'INTENT_TOP_REPLY' ? 'Top Reply' : 'Payment';
    }
  };

  return (
    <PaymentCard payment={payment} title={getPaymentTitle()} {...props}>
      {payment.receiver ? (
        <ProfileSection profile={payment.receiver} />
      ) : social ? (
        <FarcasterProfileSection social={social} />
      ) : (
        <AddressSection identity={{ address: payment.receiverAddress }} />
      )}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-start"
        spacing={0.5}
        useFlexGap
        flexWrap="wrap">
        <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
          <b>
            {payment.tokenAmount
              ? formatAmountWithSuffix(normalizeNumberPrecision(payment.tokenAmount))
              : `$${payment.usdAmount}`}
          </b>{' '}
          of
        </Typography>
        <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
          <b>{getTokenName(payment.token)}</b>
        </Typography>
        <TokenAvatar token={token as Token} sx={{ width: 15, height: 15 }} />
        <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
          on <b>{getNetworkDisplayName(payment.chainId)}</b>
        </Typography>
        <NetworkAvatar chainId={payment.chainId} sx={{ width: 15, height: 15 }} />
      </Stack>
    </PaymentCard>
  );
}

export function PaymentItem({ payment, ...props }: BoxProps & { payment: PaymentType }) {
  switch (payment.category) {
    case 'fc_storage':
      return <GiftStoragePayment payment={payment} {...props} />;
    case 'mint':
      return <MintPayment payment={payment} {...props} />;
    default:
      return <GenericPayment payment={payment} {...props} />;
  }
}
