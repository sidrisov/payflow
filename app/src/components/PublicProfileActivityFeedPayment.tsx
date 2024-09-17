import {
  Avatar,
  Box,
  BoxProps,
  IconButton,
  Link,
  Stack,
  Typography,
  Skeleton
} from '@mui/material';
import { useState } from 'react';
import { PaymentType } from '../types/PaymentType';
import NetworkAvatar from './avatars/NetworkAvatar';
import { getNetworkDefaultBlockExplorerUrl } from '../utils/networks';

import AddressAvatar from './avatars/AddressAvatar';
import { useEnsAvatar, useEnsName } from 'wagmi';
import ProfileAvatar from './avatars/ProfileAvatar';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { PublicProfileDetailsPopover } from './menu/PublicProfileDetailsPopover';
import { IdentityType, ProfileType } from '../types/ProfileType';
import { ERC20_CONTRACTS, Token } from '../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import TokenAvatar from './avatars/TokenAvatar';
import { useTokenPrices } from '../utils/queries/prices';
import { useMobile } from '../utils/hooks/useMobile';
import { PaymentMenu } from './menu/PaymentMenu';
import { MoreHoriz } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/NorthEast';
import ArrowDownwardIcon from '@mui/icons-material/SouthEast';
import { green, red } from '@mui/material/colors';
import { useMintData } from '../utils/hooks/useMintData';

const usePaymentDetails = (payment: PaymentType) => {
  const { data: tokenPrices } = useTokenPrices();
  const { mintData } = useMintData(payment);

  let token, tokenAmount, usdAmount, formattedTokenAmount, formattedUsdAmount;

  if (payment.category === 'mint' && mintData) {
    tokenAmount = '1';
  } else if (payment.category === 'fc_storage') {
    tokenAmount = payment.tokenAmount;
  } else {
    token = ERC20_CONTRACTS.find(
      (t) => t.chainId === payment.chainId && t.id === payment.token
    ) as Token;

    const price = tokenPrices ? tokenPrices[token.id] : 0;

    tokenAmount =
      payment.tokenAmount || (payment.usdAmount ? (payment.usdAmount / price).toString() : '0');
    usdAmount =
      payment.usdAmount ||
      (payment.tokenAmount ? parseFloat(payment.tokenAmount.toString()) * price : 0);
    formattedTokenAmount = formatAmountWithSuffix(
      normalizeNumberPrecision(parseFloat(tokenAmount.toString()))
    );
    formattedUsdAmount = formatAmountWithSuffix(normalizeNumberPrecision(usdAmount));
  }

  return {
    token,
    formattedTokenAmount,
    formattedUsdAmount,
    defultBlockExplorerUrl: getNetworkDefaultBlockExplorerUrl(payment.chainId),
    mintData
  };
};

function getActivityType(identity: IdentityType, payment: PaymentType) {
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

function getActivityName(identity: IdentityType, payment: PaymentType): string {
  const activityType = getActivityType(identity, payment);

  if (activityType === 'self') {
    if (payment.category === 'fc_storage') {
      return 'bought';
    } else if (payment.category === 'mint') {
      return 'minted';
    }
    return 'moved funds';
  }

  if (activityType === 'outbound' && payment.category) {
    return 'gifted';
  }

  return 'paid';
}

const ActivityIcon = ({ identity, payment }: { identity: IdentityType; payment: PaymentType }) => {
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

const CommentBubble = ({ comment }: { comment: string }) => {
  const isMobile = useMobile();
  return (
    <Typography
      variant="caption"
      fontWeight="bold"
      fontSize={isMobile ? 12 : 14}
      sx={{
        p: 1,
        border: 0.5,
        borderStyle: 'dashed',
        borderColor: 'divider',
        borderRadius: '15px',
        wordBreak: 'break-all',
        width: 'fit-content'
      }}>
      <span style={{ fontSize: 18, verticalAlign: 'middle' }}>💬</span> {comment}
    </Typography>
  );
};

// Add this interface above the PaymentDetails component
interface PaymentDetailsProps {
  payment: PaymentType;
  identity: IdentityType;
  token?: Token;
  formattedTokenAmount?: string;
  formattedUsdAmount?: string;
  mintData?: any;
}

const PaymentDetails = ({
  payment,
  identity,
  token,
  formattedTokenAmount,
  formattedUsdAmount,
  mintData
}: PaymentDetailsProps) => {
  const isMobile = useMobile();

  if (payment.category === 'fc_storage') {
    return (
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        flexWrap="wrap"
        sx={{ textWrap: 'balance' }}>
        <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
          {formattedTokenAmount} Unit{parseFloat(formattedTokenAmount!) > 1 ? 's' : ''} of Storage
        </Typography>
      </Stack>
    );
  }

  if (payment.category === 'mint') {
    if (mintData === undefined) {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Skeleton variant="rounded" width={25} height={25} />
          <Skeleton variant="text" width={120} />
        </Stack>
      );
    }

    if (mintData) {
      return (
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
          <Avatar variant="rounded" src={mintData.metadata.image} sx={{ width: 30, height: 30 }} />
          <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
            {mintData.metadata.name}:
            <Typography variant="caption" display="block" color="text.secondary">
              {mintData.collectionName}
            </Typography>
          </Typography>
        </Stack>
      );
    }
  }

  // Default case (for regular payments)
  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      flexWrap="wrap"
      sx={{ textWrap: 'balance' }}>
      <ActivityIcon identity={identity} payment={payment} />
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
    </Stack>
  );
};

export default function PublicProfileActivityFeedSection(
  props: BoxProps & { identity: IdentityType; payment: PaymentType }
) {
  const isMobile = useMobile();
  const { identity, payment } = props;
  const { token, formattedTokenAmount, formattedUsdAmount, defultBlockExplorerUrl, mintData } =
    usePaymentDetails(payment);

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

  const { data: ensNameFrom } = useEnsName({
    address: payment.senderAddress ? (payment.senderAddress as `0x${string}`) : undefined,
    chainId: 1,
    query: {
      enabled: !payment.sender && !!payment.senderAddress,
      staleTime: 300_000
    }
  });

  const { data: ensNameTo } = useEnsName({
    address: payment.receiverAddress ? (payment.receiverAddress as `0x${string}`) : undefined,
    chainId: 1,
    query: {
      enabled: !payment.receiver && !!payment.receiverAddress,
      staleTime: 300_000
    }
  });

  const avatarFrom = useEnsAvatar({
    name: ensNameFrom as string,
    chainId: 1,
    query: {
      enabled: !payment.sender && !!payment.senderAddress,
      staleTime: 300_000
    }
  });

  const avatarTo = useEnsAvatar({
    name: ensNameTo as string,
    chainId: 1,
    query: {
      enabled: !payment.receiver && !!payment.receiverAddress,
      staleTime: 300_000
    }
  });

  return (
    <>
      <Stack
        m={1}
        p={2}
        direction="row"
        spacing={0.5}
        sx={{ border: 1, borderRadius: 5, borderColor: 'divider' }}>
        {payment.sender ? (
          <ProfileAvatar profile={payment.sender} />
        ) : avatarFrom.data ? (
          <Avatar src={avatarFrom.data} />
        ) : payment.senderAddress ? (
          <AddressAvatar address={payment.senderAddress} />
        ) : (
          <Avatar>?</Avatar>
        )}
        <Stack spacing={0.5} width="100%">
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            {payment.sender ? (
              <ProfileDisplayNameWithLink
                profile={payment.sender}
                aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                onMouseEnter={(event) => {
                  setProfileDetailsPopoverAnchorEl(event.currentTarget);
                  setPopOverProfile(payment.sender);
                }}
                onMouseLeave={() => {
                  setProfileDetailsPopoverAnchorEl(null);
                  setPopOverProfile(undefined);
                }}
              />
            ) : payment.senderAddress ? (
              <AddressOrEnsWithLink
                address={payment.senderAddress}
                blockExplorerUrl={defultBlockExplorerUrl}
                ens={ensNameFrom ?? undefined}
              />
            ) : (
              <Typography noWrap variant="caption" fontSize={isMobile ? 12 : 14}>
                Unknown @unknown
              </Typography>
            )}

            <IconButton
              size="small"
              onClick={async (event) => {
                event.stopPropagation();
                setPaymentMenuAnchorEl(event.currentTarget);
                setOpenPaymentMenu(true);
              }}>
              <MoreHoriz fontSize="small" />
            </IconButton>
          </Box>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
              {getActivityName(identity, payment)}
            </Typography>
            {getActivityType(identity, payment) !== 'self' && (
              <>
                {payment.receiver ? (
                  <ProfileAvatar profile={payment.receiver} sx={{ width: 25, height: 25 }} />
                ) : avatarTo.data ? (
                  <Avatar src={avatarTo.data} sx={{ width: 25, height: 25 }} />
                ) : payment.receiverAddress ? (
                  <AddressAvatar
                    address={payment.receiverAddress}
                    scale={3}
                    sx={{ width: 25, height: 25 }}
                  />
                ) : (
                  <Avatar>?</Avatar> // Fallback avatar
                )}
                {payment.receiver ? (
                  <ProfileDisplayNameWithLink
                    profile={payment.receiver}
                    aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                    onMouseEnter={(event) => {
                      setProfileDetailsPopoverAnchorEl(event.currentTarget);
                      setPopOverProfile(payment.receiver);
                    }}
                    onMouseLeave={() => {
                      setProfileDetailsPopoverAnchorEl(null);
                      setPopOverProfile(undefined);
                    }}
                  />
                ) : (
                  <AddressOrEnsWithLink
                    address={payment.receiverAddress}
                    blockExplorerUrl={defultBlockExplorerUrl}
                    ens={ensNameTo ?? undefined}
                  />
                )}
              </>
            )}
          </Stack>
          <Link
            href={`${defultBlockExplorerUrl}/tx/${payment.hash}`}
            target="_blank"
            underline="hover"
            color="inherit"
            overflow="clip"
            textOverflow="ellipsis">
            <PaymentDetails
              payment={payment}
              identity={identity}
              token={token}
              formattedTokenAmount={formattedTokenAmount}
              formattedUsdAmount={formattedUsdAmount}
              mintData={mintData}
            />
          </Link>

          {payment.comment && <CommentBubble comment={payment.comment} />}
        </Stack>
      </Stack>
      {popoverProfile !== undefined && (
        <PublicProfileDetailsPopover
          open={popoverProfile !== undefined}
          onClose={async () => setPopOverProfile(undefined)}
          anchorEl={profileDetailsPopoverAnchorEl}
          profile={popoverProfile}
        />
      )}
      {openPaymentMenu && (
        <PaymentMenu
          open={openPaymentMenu}
          payment={payment}
          anchorEl={paymentMenuAnchorEl}
          onClose={() => {
            setOpenPaymentMenu(false);
          }}
          onClick={() => {
            setOpenPaymentMenu(false);
          }}
        />
      )}
    </>
  );
}
