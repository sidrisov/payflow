import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/AccountCard';
import { UserContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import Activity from '../components/Activity';
import { Chain, zeroAddress } from 'viem';
import { getSupportedTokens } from '../utils/erc20contracts';
import { useBalanceFetcher } from '../utils/hooks/useBalanceFetcher';
import { FlowType } from '../types/FlowType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { useTransactionsFetcher } from '../utils/hooks/useTransactionsFetcher';
import NetworkSelectorSection from '../components/NetworkSelectorSection';

export default function Accounts() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated, profile } = useContext(UserContext);

  const { flows } = profile;

  const [assetsOrActivityView, setAssetsOrActivityView] = useState<'assets' | 'activity'>('assets');

  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  // TODO: for now just select the first, later on we need to choose the main one
  useMemo(async () => {
    if (flows && flows.length > 0) {
      setSelectedFlow(flows.find((f) => f.uuid === profile.defaultFlow?.uuid));
    }
  }, [flows]);

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
              token: token.address !== zeroAddress ? token.address : undefined
            });
          });
        }
      });
    }

    setAssets(assets);
  }, [selectedFlow?.wallets]);

  const { loading, fetched, balances } = useBalanceFetcher(assets);
  const activityFetcherResult = useTransactionsFetcher(selectedFlow?.wallets ?? []);

  console.log('Loading balances: ', loading, balances);

  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();

  return (
    <>
      <Helmet>
        <title> PayFlow | Accounts </title>
      </Helmet>
      <Container maxWidth="md">
        {isAuthenticated && flows && selectedFlow ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <AccountCard
              key={`account_card`}
              flows={flows ?? []}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
              balanceFetchResult={{ loading, fetched, balances }}
              assetsOrActivityView={assetsOrActivityView}
              setAssetsOrActivityView={setAssetsOrActivityView}
            />

            <Box px={2} maxWidth={smallScreen ? 400 : 450}>
              <NetworkSelectorSection
                mx={1}
                wallets={selectedFlow.wallets}
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
              />
              {assetsOrActivityView === 'assets' ? (
                <Assets
                  selectedNetwork={selectedNetwork}
                  balanceFetchResult={{ loading, fetched, balances }}
                />
              ) : (
                <Activity
                  selectedNetwork={selectedNetwork}
                  activityFetchResult={activityFetcherResult}
                />
              )}
            </Box>
          </Box>
        ) : (
          <CenteredCircularProgress />
        )}
      </Container>
    </>
  );
}
