import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/cards/AccountCard';
import { ProfileContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import { Chain } from 'viem';
import { getSupportedTokens } from '../utils/erc20contracts';
import { FlowType } from '../types/FlowType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import NetworkSelectorSection from '../components/NetworkSelectorSection';
import { useNavigate } from 'react-router-dom';
import { useAssetBalances } from '../utils/queries/balances';
import { usePendingPayments } from '../utils/queries/payments';
import { PaymentIntentsSection } from '../components/PaymentIntentsSection';
import { ReceiptsSection } from '../components/ReceiptsSection';

export default function Accounts() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated, profile } = useContext(ProfileContext);

  const navigate = useNavigate();

  const { flows } = profile ?? { flows: [] };

  /*   const [assetsOrActivityView, setAssetsOrActivityView] = useState<'assets' | 'activity'>('assets');
   */
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
  /*   const {
    isLoading: isLoadingActivity,
    isFetched: isFetchedActivity,
    data: transactions
  } = useTransactions(selectedFlow?.wallets ?? []); */

  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();

  const {
    isLoading: isPaymentLoading,
    isFetched: isPaymentFetched,
    data: payments
  } = usePendingPayments(Boolean(profile));

  console.log('Payments: ', isPaymentLoading, isPaymentFetched, payments);

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
              /* assetsOrActivityView={assetsOrActivityView}
              setAssetsOrActivityView={setAssetsOrActivityView} */
            />

            <Box
              width={smallScreen ? 350 : 375}
              display="flex"
              flexDirection="column"
              alignItems="center">
              {isPaymentFetched && (
                <>
                  <PaymentIntentsSection
                    flow={selectedFlow}
                    payments={payments?.filter((p) => p.status === 'PENDING')}
                    width="100%"
                  />
                  <ReceiptsSection
                    payments={payments?.filter((p) => p.status === 'COMPLETED')}
                    width="100%"
                  />
                </>
              )}
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
              {/* {assetsOrActivityView === 'assets' ? (
                <Assets
                  selectedNetwork={selectedNetwork}
                  assetBalancesResult={{ isLoading, isFetched, balances }}
                />
              ) : (
                <Activity
                  selectedNetwork={selectedNetwork}
                  activityFetchResult={{
                    isLoading: isLoadingActivity,
                    isFetched: isFetchedActivity,
                    transactions
                  }}
                />
              )} */}
            </Box>
          </Box>
        ) : (
          <CenteredCircularProgress />
        )}
      </Container>
    </>
  );
}
