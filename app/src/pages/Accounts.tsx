import { Box, Stack, Tabs, Tab, Typography, Button } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/cards/AccountCard';
import { ProfileContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import { FlowType } from '@payflow/common';
import { useNavigate } from 'react-router';
import { useAssetBalances } from '../utils/queries/balances';
import getFlowAssets from '../utils/assets';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import ActivityFeed from '../components/activity/ActivityFeed';
import { useMobile } from '../utils/hooks/useMobile';

export default function Accounts() {
  const { isAuthenticated, profile, isFrameV2 } = useContext(ProfileContext);
  const isMobile = useMobile();

  const navigate = useNavigate();

  const { flows } = profile ?? { flows: [] };
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(profile?.defaultFlow ?? flows?.[0]!);

  const [showZeroBalance, setShowZeroBalance] = useState(() => {
    if (!selectedFlow?.uuid) return true;
    const stored = localStorage.getItem(`payflow:topup:${selectedFlow.uuid}:dismissed`);
    return stored ? false : true;
  });

  useEffect(() => {
    if (selectedFlow?.uuid) {
      const stored = localStorage.getItem(`payflow:topup:${selectedFlow.uuid}:dismissed`);
      setShowZeroBalance(stored ? false : true);
    }
  }, [selectedFlow?.uuid]);

  const handleHideZeroBalance = () => {
    if (selectedFlow?.uuid) {
      localStorage.setItem(`payflow:topup:${selectedFlow.uuid}:dismissed`, 'true');
      setShowZeroBalance(false);
    }
  };

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
  const showTopupPrompt = useMemo(() => {
    if (!showZeroBalance || !isFetched || !balances) {
      return false;
    }

    return Object.values(balances).every((balance) => balance.usdValue === 0);
  }, [showZeroBalance, isFetched, balances]);

  const [activeTab, setActiveTab] = useState(0);

  const [showPayflowPrompt, setShowPayflowPrompt] = useState(() => {
    const hasUserDismissed = localStorage.getItem('payflow:balance:prompt:dismissed') === 'true';
    return (
      !hasUserDismissed &&
      !profile?.flows?.find((f) => !f.archived && (!f.type || f.type === 'REGULAR'))
    );
  });

  return (
    <>
      <Helmet>
        <title> Payflow | Home </title>
      </Helmet>
      <Box display="flex" flexDirection="column" height="100%" width="100%" p={1}>
        {isAuthenticated && flows && selectedFlow ? (
          <>
            <Stack alignItems="center" spacing={1} sx={{ mt: isFrameV2 ? 0 : 1 }}>
              <AccountCard
                key={`account_card`}
                flows={flows ?? []}
                selectedFlow={selectedFlow}
                setSelectedFlow={setSelectedFlow}
                assetBalancesResult={{ isLoading, isFetched, balances }}
                balanceVisible={balanceVisible}
                setBalanceVisible={setBalanceVisible}
              />

              {showPayflowPrompt && (
                <Box
                  sx={{
                    textAlign: 'center',
                    maxWidth: 350,
                    width: '100%',
                    border: 0.5,
                    borderColor: 'divider',
                    borderRadius: '16px',
                    p: 1.5
                  }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      mb: 0.5
                    }}>
                    Create Payflow Wallet
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: 14,
                      textWrap: 'pretty',
                      mb: 1
                    }}>
                    • 1-click payments • No gas fees • AI Agent powered automated payments
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        navigate('/~/create-payflow-wallet');
                      }}
                      sx={{
                        minWidth: 100
                      }}>
                      Create
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="inherit"
                      onClick={() => {
                        localStorage.setItem('payflow:wallet:prompt:dismissed', 'true');
                        setShowPayflowPrompt(false);
                      }}
                      sx={{ minWidth: 100 }}>
                      Close
                    </Button>
                  </Stack>
                </Box>
              )}

              {showTopupPrompt && (
                <Box
                  sx={{
                    textAlign: 'center',
                    maxWidth: 350,
                    width: '100%',
                    border: 0.5,
                    borderColor: 'divider',
                    borderRadius: '16px',
                    p: 1.5
                  }}>
                  <Typography
                    color="text.secondary"
                    sx={{
                      textWrap: 'pretty',
                      fontSize: 14,
                      mb: 1
                    }}>
                    Empty balance. Top up your account to get started!
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        window.location.href =
                          '/payment/create?recipient=' + selectedFlow?.wallets?.[0].address;
                      }}
                      sx={{ minWidth: 100 }}>
                      Top Up
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="inherit"
                      onClick={handleHideZeroBalance}
                      sx={{ minWidth: 100 }}>
                      Close
                    </Button>
                  </Stack>
                </Box>
              )}

              <Tabs
                value={activeTab}
                centered
                onChange={(_, newValue) => setActiveTab(newValue)}
                slotProps={{
                  indicator: {
                    sx: {
                      display: 'none'
                    }
                  }
                }}
                sx={{
                  maxWidth: 375,
                  '& .MuiTab-root': {
                    fontSize: 14,
                    fontWeight: 'bold',
                    borderRadius: 5
                  }
                }}>
                <Tab label="Tokens" />
                <Tab label="History" />
              </Tabs>

              <Box
                width="100%"
                maxWidth={375}
                overflow="auto"
                height={`calc(100vh - ${isMobile ? 255 : 265}px)`}>
                {activeTab === 0 && (
                  <Assets
                    assetBalancesResult={{ isLoading, isFetched, balances }}
                    balanceVisible={balanceVisible}
                  />
                )}
                {activeTab === 1 && <ActivityFeed identity={{ address: profile?.identity! }} />}
              </Box>
            </Stack>
          </>
        ) : (
          <LoadingPayflowEntryLogo />
        )}
      </Box>
    </>
  );
}
