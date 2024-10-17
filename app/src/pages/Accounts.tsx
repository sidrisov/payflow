import { Box, Stack } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/cards/AccountCard';
import { ProfileContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import { FlowType } from '../types/FlowType';
import { useNavigate } from 'react-router-dom';
import { useAssetBalances } from '../utils/queries/balances';
import getFlowAssets from '../utils/assets';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useMobile } from '../utils/hooks/useMobile';
import { PaymentSection } from '../components/sections/PaymentSection';

export default function Accounts() {
  const smallScreen = useMobile();

  const { isAuthenticated, profile } = useContext(ProfileContext);

  const navigate = useNavigate();

  const { flows } = profile ?? { flows: [] };
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(profile?.defaultFlow!);

  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    if (!profile) {
      navigate('/connect');
    }
  }, []);

  const [assets, setAssets] = useState<AssetType[]>([]);

  useMemo(async () => {
    let assets: AssetType[] = [];

    if (selectedFlow) {
      assets = getFlowAssets(selectedFlow);
    }

    console.log('Assets:', assets);

    setAssets(assets);
  }, [selectedFlow]);

  const { isLoading, isFetched, data: balances } = useAssetBalances(assets);

  return (
    <>
      <Helmet>
        <title> Payflow | Home </title>
      </Helmet>
      <Box display="flex" flexDirection="column" height="100%" width="100%">
        {isAuthenticated && flows && selectedFlow ? (
          <Stack p={1} alignItems="center" spacing={1}>
            <AccountCard
              key={`account_card`}
              flows={flows ?? []}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
              assetBalancesResult={{ isLoading, isFetched, balances }}
              balanceVisible={balanceVisible}
              setBalanceVisible={setBalanceVisible}
            />

            <Stack width={smallScreen ? 350 : 375} spacing={0.5} alignItems="center">
              <PaymentSection width="100%" type="intent" />
              <PaymentSection width="100%" type="receipt" />
              <Assets
                assetBalancesResult={{ isLoading, isFetched, balances }}
                balanceVisible={balanceVisible}
              />
            </Stack>
          </Stack>
        ) : (
          <LoadingPayflowEntryLogo />
        )}
      </Box>
    </>
  );
}
