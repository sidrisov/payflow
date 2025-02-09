import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  CircularProgress,
  Avatar,
  Button,
  Container
} from '@mui/material';
import { useState, useEffect, useContext, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { useNavigate } from 'react-router-dom';
import { ProfileContext } from '../contexts/UserContext';
import FrameV2SDK from '@farcaster/frame-sdk';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import { normalizeNumberPrecision } from '../utils/formats';
import { getTokenByAddress } from '@payflow/common';
import TokenNetworkAvatar from '../components/avatars/TokenNetworkAvatar';
import { fetchState } from '@withfabric/protocol-sdks/stpv2';
import CenteredCircularProgress from '../components/CenteredCircularProgress';

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface SubscriptionMetadata {
  title: string;
  symbol: string;
  art_url: string;
  external_link: string;
}

interface SubscriptionPrice {
  period_duration_seconds: number;
  tokens_per_period: string;
}

interface SubscriptionToken {
  symbol: string;
  address: string;
  decimals: number;
  erc20: boolean;
}

interface Subscription {
  object: string;
  creator: FarcasterUser;
  provider_name: string;
  contract_address: string;
  chain: number;
  chain_id: number;
  metadata: SubscriptionMetadata;
  owner_address: string;
  price: SubscriptionPrice;
  protocol_version: number;
  token: SubscriptionToken;
  expires_at: string;
  subscribed_at: string;
}

const SubscriptionCard = ({ subscription }: { subscription: Subscription }) => {
  const { isFrameV2 } = useContext(ProfileContext);
  const creatorUrl = `https://warpcast.com/${subscription.creator.username}`;

  const token = useMemo(
    () => getTokenByAddress(subscription.chain_id, subscription.token.address),
    [subscription.chain_id, subscription.token.address]
  );

  const formattedAmount = normalizeNumberPrecision(
    parseFloat(formatEther(BigInt(subscription.price.tokens_per_period)))
  );

  const formatPeriod = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };
  const expiresAt = new Date(subscription.expires_at);
  const isExpired = expiresAt < new Date();
  const expirationText = isExpired
    ? `Expired ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
    : `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;

  return (
    <Card elevation={5} sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={subscription.metadata.art_url}
              alt={subscription.metadata.title}
              sx={{ width: 48, height: 48 }}
            />
            <Stack spacing={1} flex={1} alignItems="flex-start" justifyContent="center">
              <Typography variant="subtitle1" fontWeight="medium">
                {subscription.metadata.title}
              </Typography>
              <Button
                onClick={() => {
                  if (isFrameV2) {
                    FrameV2SDK.actions.openUrl(creatorUrl);
                  } else {
                    window.open(creatorUrl, '_blank');
                  }
                }}
                sx={{
                  p: 0,
                  minWidth: 'auto',
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    by
                  </Typography>
                  <Avatar src={subscription.creator.pfp_url} sx={{ width: 20, height: 20 }} />
                  <Typography variant="body2">{subscription.creator.username}</Typography>
                </Stack>
              </Button>

              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {token && <TokenNetworkAvatar token={token} size={20} badgeSize={10} />}
                  <Typography variant="caption" color="text.secondary">
                    {formattedAmount} {token?.name || subscription.token.symbol} /{' '}
                    {formatPeriod(subscription.price.period_duration_seconds)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color={isExpired ? 'error' : 'text.secondary'}>
                  {expirationText}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Button
            fullWidth
            disabled={!subscription.metadata.external_link}
            variant="contained"
            size="small"
            onClick={() => {
              if (subscription.metadata.external_link) {
                if (isFrameV2) {
                  FrameV2SDK.actions.openUrl(subscription.metadata.external_link);
                } else {
                  window.open(subscription.metadata.external_link, '_blank');
                }
              } else {
                console.log('no external link');
              }
            }}
            sx={{ borderRadius: 2 }}>
            {isExpired ? 'Subscribe' : 'Extend'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const SubscriptionsPage = () => {
  const { profile } = useContext(ProfileContext);
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeSubscriptions, expiredSubscriptions } = useMemo(() => {
    const activeSubscriptions = [];
    const expiredSubscriptions = [];

    for (const subscription of subscriptions) {
      if (new Date(subscription.expires_at).getTime() <= new Date().getTime()) {
        expiredSubscriptions.push(subscription);
      } else {
        activeSubscriptions.push(subscription);
      }
    }

    return { activeSubscriptions, expiredSubscriptions };
  }, [subscriptions]);

  useEffect(() => {
    if (!profile) {
      navigate(`/connect?redirect=/subscriptions`);
    }
  }, [profile, navigate]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!profile) return;

      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/user/me/subscribedTo`, {
          withCredentials: true
        });

        const subscriptionsWithMetadata = await Promise.all(
          response.data.map(async (subscription: Subscription) => {
            try {
              const state = await fetchState({
                contractAddress: subscription.contract_address as `0x${string}`,
                chainId: subscription.chain_id
              });

              let external_link;
              if (state.contractURI) {
                try {
                  const metadataResponse = await axios.get(state.contractURI);
                  console.log('metadataResponse', metadataResponse);
                  external_link = metadataResponse.data.external_link.replace('collection', 's');
                } catch (error) {
                  console.error('Error fetching contract metadata:', error);
                }
              }

              console.log('external_link', external_link);

              return {
                ...subscription,
                metadata: {
                  ...subscription.metadata,
                  external_link: external_link
                }
              };
            } catch (error) {
              console.error('Error fetching contract state:', error);
              return subscription;
            }
          })
        );

        setSubscriptions(subscriptionsWithMetadata);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        toast.error('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [profile]);

  return (
    <Container maxWidth="sm">
      {loading ? (
        <CenteredCircularProgress />
      ) : (
        <Stack spacing={3}>
          {activeSubscriptions.length > 0 && (
            <Box>
              <Typography textAlign="center" variant="h6" sx={{ mb: 2 }}>
                Active Hypersub Subscriptions
              </Typography>
              {activeSubscriptions.map((subscription) => (
                <SubscriptionCard key={subscription.contract_address} subscription={subscription} />
              ))}
            </Box>
          )}

          {expiredSubscriptions.length > 0 && (
            <Box>
              <Typography textAlign="center" variant="h6" sx={{ mb: 2 }}>
                Expired Hypersub Subscriptions
              </Typography>
              {expiredSubscriptions.map((subscription) => (
                <SubscriptionCard key={subscription.contract_address} subscription={subscription} />
              ))}
            </Box>
          )}

          {subscriptions.length === 0 && (
            <Typography variant="body1" color="text.secondary" align="center">
              No subscriptions found
            </Typography>
          )}
        </Stack>
      )}
    </Container>
  );
};

export default SubscriptionsPage;
