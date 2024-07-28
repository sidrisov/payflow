import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/cards/AccountCard';
import { ProfileContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import { Chain, formatUnits } from 'viem';
import { getSupportedTokens } from '../utils/erc20contracts';
import { FlowType } from '../types/FlowType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import NetworkSelectorSection from '../components/NetworkSelectorSection';
import { useNavigate } from 'react-router-dom';
import { useAssetBalances } from '../utils/queries/balances';
import { usePendingPayments } from '../utils/queries/payments';
import { PaymentIntentsSection } from '../components/PaymentIntentsSection';
import { ReceiptsSection } from '../components/ReceiptsSection';
import { QUERY_CONTACTS_FAN_TOKENS } from '../utils/airstackQueries';
import { fetchQuery } from '@airstack/airstack-react';
import {
  FarcasterFanTokenAuction,
  GetFanTokenAuctionsForContactsQuery
} from '../generated/graphql/types';
import { useContacts } from '../utils/queries/contacts';
import { FARCASTER_DAPP } from '../utils/dapps';
import { countdown } from '../utils/date';
import { Circle } from '@mui/icons-material';
import { ContactWithFanTokenAuction } from '../types/ProfleType';
import { ProfileSection } from '../components/ProfileSection';
import { AddressSection } from '../components/AddressSection';

const FanTokenAuctionCard = () => {
  const { isFetching: isFetchingContacts, data } = useContacts({
    enabled: true
  });

  const [contactsWithAuction, setContactsWithAuction] = useState<ContactWithFanTokenAuction[]>([]);

  useMemo(async () => {
    console.log('Contacts:', data, isFetchingContacts);
    if (!isFetchingContacts && data && data.contacts.length > 0) {
      const entityNames = data?.contacts
        .map((c) => c.data.meta?.socials.find((s) => s.dappName === FARCASTER_DAPP)?.profileName)
        .filter((profileName) => profileName);

      const { data: auctionsData } = await fetchQuery<GetFanTokenAuctionsForContactsQuery>(
        QUERY_CONTACTS_FAN_TOKENS,
        {
          status: ['UPCOMING', 'ACTIVE'],
          entityNames
        },
        {
          cache: true
        }
      );

      const contactsWithFanTokenAuctions = (
        auctionsData?.FarcasterFanTokenAuctions
          ?.FarcasterFanTokenAuction as FarcasterFanTokenAuction[]
      ).map(
        (auction) =>
          ({
            contact: data?.contacts.find((c) =>
              c.data.meta?.socials.find(
                (s) => s.dappName === FARCASTER_DAPP && s.profileName === auction.entityName
              )
            ),
            auction
          } as ContactWithFanTokenAuction)
      );

      setContactsWithAuction(contactsWithFanTokenAuctions);
    }
  }, [isFetchingContacts, data]);

  return (
    <Card
      elevation={3}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: '15px',
        width: 350,
        minHeight: 150,
        padding: 1
      }}>
      <CardHeader
        title="Ⓜ️ Fan Token Auctions"
        titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
        sx={{ padding: 0.5, paddingBottom: 0 }}
      />
      <CardContent>
        <Box
          display="flex"
          gap={2}
          sx={{
            overflowX: 'scroll',
            scrollbarWidth: 'none',
            '&-ms-overflow-style:': {
              display: 'none'
            },
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
          {contactsWithAuction &&
            contactsWithAuction.map((contactWithAuction) => (
              <Card
                elevation={2}
                key={`contact_auction_card:${contactWithAuction.contact.data.address}`}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '15px',
                  minWidth: 220
                }}>
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                  <Stack justifyContent="flex-start" spacing={1}>
                    <Box
                      display="flex"
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center">
                      <Typography variant="caption">
                        Supply:{' '}
                        <b>
                          {parseFloat(
                            formatUnits(
                              BigInt(contactWithAuction.auction.auctionSupply as number),
                              contactWithAuction.auction.decimals as number
                            )
                          ).toFixed(0)}
                        </b>
                      </Typography>
                      <Chip
                        size="small"
                        {...(contactWithAuction.auction.launchCastUrl
                          ? {
                              component: 'a',
                              href: contactWithAuction.auction.launchCastUrl,
                              target: '_blank',
                              clickable: true,
                              icon: <Circle color="success" sx={{ width: 10, height: 10 }} />,
                              label: (
                                <Typography variant="caption">
                                  <b>live</b>
                                </Typography>
                              )
                            }
                          : {
                              label: (
                                <Typography variant="caption">
                                  in{' '}
                                  <b>
                                    {countdown(contactWithAuction.auction.estimatedStartTimestamp)}
                                  </b>
                                </Typography>
                              )
                            })}
                      />
                    </Box>
                    {contactWithAuction.contact.data.profile ? (
                      <ProfileSection
                        maxWidth={200}
                        profile={contactWithAuction.contact.data.profile}
                      />
                    ) : (
                      <AddressSection maxWidth={200} identity={contactWithAuction.contact.data} />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default function Accounts() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated, profile } = useContext(ProfileContext);

  const navigate = useNavigate();

  const { flows } = profile ?? { flows: [] };

  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  useEffect(() => {
    if (!profile) {
      navigate('/search');
    }
  }, []);

  useEffect(() => {
    if (!selectedFlow && flows && flows.length > 0) {
      setSelectedFlow(flows.find((f) => f.uuid === profile?.defaultFlow?.uuid));
    }
  }, [selectedFlow, flows]);

  const [assets, setAssets] = useState<AssetType[]>([]);

  useMemo(async () => {
    let assets: AssetType[] = [];

    if (selectedFlow) {
      selectedFlow.wallets.forEach((wallet) => {
        const chainId = wallet.network;
        if (chainId) {
          const tokens = getSupportedTokens(chainId);
          tokens.forEach((token) => {
            assets.push({
              address: wallet.address,
              chainId,
              token
            });
          });
        }
      });
    }

    console.log('Assets:', assets);

    setAssets(assets);
  }, [selectedFlow]);

  const { isLoading, isFetched, data: balances } = useAssetBalances(assets);

  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();

  const { isFetched: isPaymentFetched, data: payments } = usePendingPayments(Boolean(profile));

  return (
    <>
      <Helmet>
        <title> Payflow | Home </title>
      </Helmet>
      <Container maxWidth="md">
        {isAuthenticated && flows && selectedFlow ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <AccountCard
              key={`account_card`}
              flows={flows ?? []}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
              assetBalancesResult={{ isLoading, isFetched, balances }}
            />

            <Stack width={smallScreen ? 350 : 375} spacing={1} alignItems="center">
              {isPaymentFetched && (
                <>
                  <PaymentIntentsSection
                    flows={flows}
                    selectedFlow={selectedFlow}
                    setSelectedFlow={setSelectedFlow}
                    payments={payments?.filter((p) => p.status === 'PENDING')}
                    width="100%"
                  />
                  <ReceiptsSection
                    payments={payments?.filter((p) => p.status === 'COMPLETED')}
                    width="100%"
                  />
                </>
              )}
              {profile?.username === 'sinaver' && <FanTokenAuctionCard />}
              <NetworkSelectorSection
                width="100%"
                wallets={selectedFlow.wallets}
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
              />
              <Assets
                selectedNetwork={selectedNetwork}
                assetBalancesResult={{ isLoading, isFetched, balances }}
              />
            </Stack>
          </Box>
        ) : (
          <CenteredCircularProgress />
        )}
      </Container>
    </>
  );
}
