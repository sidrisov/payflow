import { Box, CircularProgress, Container, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AccountNewDialog from '../components/AccountNewDialog';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';
import { AccountCard } from '../components/AccountCard';
import { UserContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import Activity from '../components/Activity';
import { useNetwork } from 'wagmi';
import { zeroAddress } from 'viem';
import { getSupportedTokens } from '../utils/erc20contracts';
import { useBalanceFetcher } from '../utils/hooks/useBalanceFetcher';
import { FlowType } from '../types/FlowType';

export default function Accounts() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated, accounts, flows, setInitiateAccountsRefresh } = useContext(UserContext);
  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState<string[]>([]);

  const [openAccountCreate, setOpenAccountCreate] = useState(false);

  const [assetsOrActivityView, setAssetsOrActivityView] = useState<'assets' | 'activity'>('assets');

  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  useMemo(async () => {
    if (accounts) {
      let availableNetworks = smartAccountCompatibleChains();
      if (accounts.length > 0) {
        const addedNetworks = accounts.map((account) => account.network);
        availableNetworks = availableNetworks.filter((c) => !addedNetworks.includes(c));
      }
      setAvailableNetworksToAddAccount(availableNetworks);
    }

    console.log('Accounts');
  }, [accounts]);

  // TODO: for now just select the first, later on we need to choose the main one
  useMemo(async () => {
    if (flows && flows.length > 0) {
      setSelectedFlow(flows[0]);
    }
  }, [flows]);

  const [assets, setAssets] = useState<AssetType[]>([]);

  const { chains } = useNetwork();

  useMemo(async () => {
    let assets: AssetType[] = [];

    if (selectedFlow) {
      selectedFlow.wallets.forEach((wallet) => {
        const chainId = chains.find((c) => c.name === wallet.network)?.id;
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

  console.log('Accounts', loading, balances);

  return (
    <>
      <Helmet>
        <title> PayFlow | Accounts </title>
      </Helmet>
      <Container maxWidth="md">
        {isAuthenticated && accounts && flows && selectedFlow ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <AccountCard
              key={`account_card_${accounts[0].address}_${accounts[0].network}`}
              accounts={accounts}
              flows={flows ?? []}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
              balanceFetchResult={{ loading, fetched, balances }}
              assetsOrActivityView={assetsOrActivityView}
              setAssetsOrActivityView={setAssetsOrActivityView}
            />

            <Box maxWidth={smallScreen ? 350 : 600}>
              {assetsOrActivityView === 'assets' ? (
                <Assets
                  wallets={selectedFlow.wallets}
                  balanceFetchResult={{ loading, fetched, balances }}
                />
              ) : (
                <Activity accounts={accounts} />
              )}
            </Box>
          </Box>
        ) : (
          <Box
            position="fixed"
            display="flex"
            alignItems="center"
            boxSizing="border-box"
            justifyContent="center"
            sx={{ inset: 0 }}>
            <CircularProgress size={30} />
          </Box>
        )}
      </Container>

      <AccountNewDialog
        open={openAccountCreate}
        networks={availableNetworksToAddAccount}
        closeStateCallback={async () => {
          setOpenAccountCreate(false);
          // TODO: just refresh, lately it's better to track each flow's update separately
          setInitiateAccountsRefresh(true);
        }}
      />
    </>
  );
}
