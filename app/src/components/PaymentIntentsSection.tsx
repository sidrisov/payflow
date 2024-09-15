import { Avatar, Skeleton, Stack, StackProps, Typography } from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { ProfileSection } from './ProfileSection';
import { useEffect, useState } from 'react';
import TokenAvatar from './avatars/TokenAvatar';
import { getNetworkDisplayName } from '../utils/networks';
import NetworkAvatar from './avatars/NetworkAvatar';
import getTokenName, { ERC20_CONTRACTS, Token } from '../utils/erc20contracts';
import { AddressSection } from './AddressSection';
import { FlowType } from '../types/FlowType';
import { FarcasterProfileSection } from './FarcasterProfileSection';
import {
  QUERY_FARCASTER_PROFILE,
  QUERY_FARCASTER_PROFILE_BY_IDENTITY
} from '../utils/airstackQueries';
import { useQuery } from '@airstack/airstack-react';
import { Social } from '../generated/graphql/types';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import { fetchMintData, MintMetadata } from '../utils/mint';
import { Address } from 'viem';
import { grey } from '@mui/material/colors';
import { useDarkMode } from '../utils/hooks/useDarkMode';
import { useMobile } from '../utils/hooks/useMobile';
import { PaymentSection } from './sections/PaymentSection';
import { PaymentCard } from './cards/PaymentCard';

export function PaymentIntentsSection({
  flows,
  selectedFlow,
  setSelectedFlow,
  payments,
  ...props
}: {
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  payments?: PaymentType[];
} & {} & StackProps) {
  const isMobile = useMobile();
  const prefersDarkMode = useDarkMode();

  return (
    payments && (
      <PaymentSection
        payments={payments}
        type="intent"
        {...props}
        renderPayment={(payment: PaymentType, index: number) => (
          <>
            {payment.receiverFid !== undefined ? (
              payment.category === 'fc_storage' ? (
                <GiftStoragePayment key={`pending_payment_${index}`} payment={payment} />
              ) : (
                payment.category === 'mint' && (
                  <MintPayment key={`pending_payment_${index}`} payment={payment} />
                )
              )
            ) : (
              <IntentPayment key={`pending_payment_${index}`} payment={payment} />
            )}
          </>
        )}
      />
    )
  );

  function GiftStoragePayment({ payment }: { payment: PaymentType }) {
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

    const numberOfUnits = payment.tokenAmount ?? 1;
    return (
      <PaymentCard payment={payment} title="Buy Storage">
        {loadingSocials || !social ? (
          <Skeleton variant="rounded" sx={{ width: '100%', height: '100%' }} />
        ) : (
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
      </PaymentCard>
    );
  }

  function MintPayment({ payment }: { payment: PaymentType }) {
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
      <PaymentCard payment={payment} title="Mint">
        {loadingSocials || !social || !mintData ? (
          <Skeleton variant="rounded" sx={{ width: '100%', height: '100%' }} />
        ) : (
          <>
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
      </PaymentCard>
    );
  }

  function IntentPayment({ payment }: { payment: PaymentType }) {
    const token = ERC20_CONTRACTS.find(
      (t) => t.chainId === payment.chainId && t.id === payment.token
    );

    const { data: social } = useQuery<Social>(
      QUERY_FARCASTER_PROFILE_BY_IDENTITY,
      { identity: payment.receiverAddress },
      {
        cache: true,
        dataFormatter(data) {
          return data.Socials.Social[0];
        }
      }
    );

    return (
      <PaymentCard
        payment={payment}
        title={payment.type === 'INTENT_TOP_REPLY' ? 'Top Reply' : 'Payment'}>
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
      </PaymentCard>
    );
  }
}
