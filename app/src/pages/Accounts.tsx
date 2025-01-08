import { Box, Stack, Tabs, Tab } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/cards/AccountCard';
import { ProfileContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import { FlowType } from '@payflow/common';
import { useNavigate } from 'react-router-dom';
import { useAssetBalances } from '../utils/queries/balances';
import getFlowAssets from '../utils/assets';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { PaymentSection } from '../components/sections/PaymentSection';
import { green } from '@mui/material/colors';
import { MdOutlinePlaylistAdd } from 'react-icons/md';
import { MdOutlinePlaylistAddCheck } from 'react-icons/md';
import { GiTwoCoins } from 'react-icons/gi';
import ActivityFeed from '../components/activity/ActivityFeed';

export default function Accounts() {
  const { isAuthenticated, profile } = useContext(ProfileContext);

  const navigate = useNavigate();

  const { flows } = profile ?? { flows: [] };
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(profile?.defaultFlow ?? flows?.[0]!);

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

  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <Helmet>
        <title> Payflow | Home </title>
      </Helmet>
      <Box display="flex" flexDirection="column" height="100%" width="100%" overflow="hidden">
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

            <Tabs
              value={activeTab}
              centered
              textColor="inherit"
              onChange={(_, newValue) => setActiveTab(newValue)}
              TabIndicatorProps={{ sx: { display: 'none' } }}
              sx={{
                maxWidth: 375,
                mb: 2,
                '& .MuiTab-root': {
                  fontSize: 14,
                  fontWeight: 'bold',
                  borderRadius: 5
                },
                '& .Mui-selected': {
                  color: green.A700
                }
              }}>
              <Tab icon={<MdOutlinePlaylistAddCheck size={20} />} label="Activity" />
              <Tab icon={<MdOutlinePlaylistAdd size={20} />} label="Intents" />
              <Tab icon={<GiTwoCoins size={20} />} label="Tokens" />
            </Tabs>

            <Box flexGrow={1} px={1} overflow="auto" width="100%" maxWidth={375}>
              {activeTab === 0 && (
                <Box sx={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
                  <ActivityFeed identity={{ address: profile?.identity! }} />
                </Box>
              )}
              {activeTab === 1 && <PaymentSection width="100%" type="intent" />}
              {activeTab === 2 && (
                <Assets
                  assetBalancesResult={{ isLoading, isFetched, balances }}
                  balanceVisible={balanceVisible}
                />
              )}
            </Box>
          </Stack>
        ) : (
          <LoadingPayflowEntryLogo />
        )}
      </Box>
    </>
  );
}
