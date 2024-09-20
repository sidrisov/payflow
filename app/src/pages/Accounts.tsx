import { Container, Stack } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AccountCard } from '../components/cards/AccountCard';
import { ProfileContext } from '../contexts/UserContext';
import Assets from '../components/Assets';
import { AssetType } from '../types/AssetType';
import { FlowType } from '../types/FlowType';
import { useNavigate } from 'react-router-dom';
import { useAssetBalances } from '../utils/queries/balances';
import { usePendingPayments } from '../utils/queries/payments';
import { PaymentIntentsSection } from '../components/PaymentIntentsSection';
import { PaymentReceiptsSection } from '../components/PaymentReceiptsSection';
import getFlowAssets from '../utils/assets';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useMobile } from '../utils/hooks/useMobile';

export default function Accounts() {
  const smallScreen = useMobile();

  const { isAuthenticated, profile } = useContext(ProfileContext);

  const navigate = useNavigate();

  const { flows } = profile ?? { flows: [] };

  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  const [balanceVisible, setBalanceVisible] = useState(false);

  useEffect(() => {
    if (!profile) {
      navigate('/connect');
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
      assets = getFlowAssets(selectedFlow);
    }

    console.log('Assets:', assets);

    setAssets(assets);
  }, [selectedFlow]);

  const { isLoading, isFetched, data: balances } = useAssetBalances(assets);

  const { isFetched: isPaymentFetched, data: payments } = usePendingPayments(Boolean(profile));

  return (
    <>
      <Helmet>
        <title> Payflow | Home </title>
      </Helmet>
      <Container maxWidth="md">
        {isAuthenticated && flows && selectedFlow ? (
          <Stack alignItems="center" spacing={1}>
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
              {isPaymentFetched && (
                <>
                  <PaymentIntentsSection
                    payments={payments?.filter(
                      (p) => p.status === 'PENDING' || p.status === 'INPROGRESS'
                    )}
                    width="100%"
                  />
                  <PaymentReceiptsSection
                    payments={payments?.filter(
                      (p) => p.status === 'COMPLETED' || p.status === 'REFUNDED'
                    )}
                    width="100%"
                  />
                </>
              )}
              <Assets 
                assetBalancesResult={{ isLoading, isFetched, balances }} 
                balanceVisible={balanceVisible}
              />
            </Stack>
          </Stack>
        ) : (
          <LoadingPayflowEntryLogo />
        )}
      </Container>
    </>
  );
}
