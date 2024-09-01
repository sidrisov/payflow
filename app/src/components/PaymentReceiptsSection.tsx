import {
  Avatar,
  Box,
  BoxProps,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  StackProps,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { ProfileSection } from './ProfileSection';
import { useEffect, useState } from 'react';
import { ExpandLess, ExpandMore, MoreHoriz } from '@mui/icons-material';
import TokenAvatar from './avatars/TokenAvatar';
import { getNetworkDisplayName } from '../utils/networks';
import NetworkAvatar from './avatars/NetworkAvatar';
import getTokenName, { ERC20_CONTRACTS, Token } from '../utils/erc20contracts';
import { AddressSection } from './AddressSection';
import { PaymentMenu } from './menu/PaymentMenu';
import { FarcasterProfileSection } from './FarcasterProfileSection';
import { QUERY_FARCASTER_PROFILE } from '../utils/airstackQueries';
import { useQuery } from '@airstack/airstack-react';
import { Social } from '../generated/graphql/types';
import { formatAmountWithSuffix } from '../utils/formats';
import calculateMaxPages from '../utils/pagination';
import { MdOutlinePlaylistAddCheck } from 'react-icons/md';
import { grey } from '@mui/material/colors';
import { fetchMintData, MintMetadata } from '../utils/mint';
import { Address } from 'viem';

const pageSize = 10;

export function PaymentReceiptsSection({
  payments,
  ...props
}: { payments?: PaymentType[] } & StackProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expand, setExpand] = useState<boolean>(false);

  const maxPages = calculateMaxPages(payments?.length ?? 0, pageSize);
  const [page, setPage] = useState<number>(1);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    payments && (
      <>
        <Stack {...props} px={1} spacing={1}>
          <Box
            px={0.5}
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center">
            <Chip
              icon={<MdOutlinePlaylistAddCheck color="inherit" size={24} />}
              label={`Receipts (${payments.length})`}
              variant="outlined"
              sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
            />
            <IconButton size="small" color="inherit" onClick={() => setExpand(!expand)}>
              {expand ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          {expand && (
            <Stack
              px={1.5}
              pb={1}
              direction="row"
              spacing={3}
              sx={{
                overflowX: 'scroll',
                scrollbarWidth: 'auto', // Hide the scrollbar for firefox
                '&::-webkit-scrollbar': {
                  display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
                },
                '&-ms-overflow-style:': {
                  display: 'none' // Hide the scrollbar for IE
                },
                '-webkit-overflow-scrolling': 'touch' // Improve scrolling on iOS
              }}>
              {payments
                .slice(0, page * pageSize)
                .map((payment, index) =>
                  payment.receiverFid !== undefined ? (
                    payment.category === 'fc_storage' ? (
                      <GiftStoragePayment key={`completed_payment_${index}`} payment={payment} />
                    ) : (
                      payment.category === 'mint' && (
                        <MintPayment key={`pending_payment_${index}`} payment={payment} />
                      )
                    )
                  ) : (
                    <IntentPayment key={`completed_payment_${index}`} payment={payment} />
                  )
                )}
              {page < maxPages && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  sx={{
                    p: 3,
                    minWidth: isMobile ? 145 : 155,
                    textTransform: 'none',
                    borderRadius: 5
                  }}>
                  <Typography variant="subtitle2">More receipts</Typography>
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </>
    )
  );

  function GiftStoragePayment({ payment, ...props }: BoxProps & { payment: PaymentType }) {
    const { data: social, loading: loadingSocials } = useQuery<Social>(
      QUERY_FARCASTER_PROFILE,
      { fid: payment.receiverFid?.toString() },
      {
        cache: true,
        dataFormatter(data) {
          return data.Socials.Social[0];
        }
      }
    );

    const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
    const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

    const numberOfUnits = payment.tokenAmount ?? 1;

    return (
      <>
        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderRadius: 5,
            borderColor: 'divider',
            minWidth: isMobile ? 145 : 155,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 1,
            color: 'inherit'
          }}
          {...props}>
          {loadingSocials || !social ? (
            <Skeleton variant="rounded" sx={{ width: '100%', height: '100%' }} />
          ) : (
            <>
              <Box
                alignSelf="stretch"
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
                  Buy Storage
                </Typography>
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
        </Box>
        {openPaymentMenu && (
          <PaymentMenu
            open={openPaymentMenu}
            payment={payment}
            anchorEl={paymentMenuAnchorEl}
            onClose={async () => {
              setOpenPaymentMenu(false);
            }}
            onClick={async () => {
              setOpenPaymentMenu(false);
            }}
          />
        )}
      </>
    );
  }

  function MintPayment({ payment, ...props }: BoxProps & { payment: PaymentType }) {
    const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
    const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

    const [mintData, setMintData] = useState<MintMetadata>();
    const { data: social, loading: loadingSocials } = useQuery<Social>(
      QUERY_FARCASTER_PROFILE,
      { fid: payment.receiverFid?.toString() },
      {
        cache: true,
        dataFormatter(data) {
          return data.Socials.Social[0];
        }
      }
    );

    useEffect(() => {
      const fetchData = async () => {
        type ParsedMintData = {
          provider: string;
          contract: Address;
          tokenId?: number;
        };

        function parseMintToken(token: string): ParsedMintData {
          const [provider, contract, tokenId] = token.split(':');
          return {
            provider,
            contract: contract as Address,
            tokenId: tokenId ? parseInt(tokenId) : undefined
          };
        }

        const parsedMintData = parseMintToken(payment.token);
        const mintData = await fetchMintData(
          parsedMintData.provider,
          payment.chainId,
          parsedMintData.contract,
          parsedMintData.tokenId
        );

        setMintData(mintData);
      };

      if (payment) {
        fetchData();
      }
    }, [payment]);

    return (
      <>
        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderRadius: 5,
            borderColor: 'divider',
            minWidth: isMobile ? 145 : 155,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 1,
            color: 'inherit'
          }}
          {...props}>
          {loadingSocials || !social || !mintData ? (
            <Skeleton variant="rounded" sx={{ width: '100%', height: '100%' }} />
          ) : (
            <>
              <Box
                alignSelf="stretch"
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
                  Mint
                </Typography>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenPaymentMenu(true);
                    setPaymentMenuAnchorEl(event.currentTarget);
                  }}>
                  <MoreHoriz fontSize="small" />
                </IconButton>
              </Box>

              <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={0.5}>
                <Avatar
                  variant="rounded"
                  src={mintData.metadata.image}
                  sx={{
                    width: 40,
                    height: 40
                  }}
                />
                <Typography
                  textAlign="start"
                  variant="subtitle2"
                  sx={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    wordBreak: 'break-word'
                  }}>
                  {mintData.metadata.name}
                </Typography>
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
        </Box>
        {openPaymentMenu && payment && (
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

  function IntentPayment({ payment, ...props }: BoxProps & { payment: PaymentType }) {
    const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
    const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

    const token = ERC20_CONTRACTS.find(
      (t) => t.chainId === payment.chainId && t.id === payment.token
    );
    return (
      <>
        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderRadius: 5,
            borderColor: 'divider',
            minWidth: isMobile ? 145 : 155,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 1,
            color: 'inherit'
          }}
          {...props}>
          <Box
            alignSelf="stretch"
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
              {payment.type === 'INTENT_TOP_REPLY' ? 'Top Reply' : 'Payment'}
            </Typography>
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

          {payment.receiver ? (
            <ProfileSection profile={payment.receiver} />
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
                  ? formatAmountWithSuffix(payment.tokenAmount.toString())
                  : `$${payment.usdAmount}`}
              </b>{' '}
              of
            </Typography>
            <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
              <b>{getTokenName(payment.token)}</b>
            </Typography>
            <TokenAvatar
              token={token as Token}
              sx={{
                width: 15,
                height: 15
              }}
            />
            <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
              on <b>{getNetworkDisplayName(payment.chainId)}</b>
            </Typography>
            <NetworkAvatar
              chainId={payment.chainId}
              sx={{
                width: 15,
                height: 15
              }}
            />
          </Stack>
        </Box>
        {openPaymentMenu && (
          <PaymentMenu
            open={openPaymentMenu}
            payment={payment}
            anchorEl={paymentMenuAnchorEl}
            onClose={async () => {
              setOpenPaymentMenu(false);
            }}
            onClick={async () => {
              setOpenPaymentMenu(false);
            }}
          />
        )}
      </>
    );
  }
}
