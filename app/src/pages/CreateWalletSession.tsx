import { Container } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useNavigate, useParams } from 'react-router-dom';
import { WalletPermissionsDialog } from '../components/dialogs/WalletPermissionsDialog';
import { toast } from 'react-toastify';
import { base } from 'viem/chains';
import { FlowType } from '@payflow/common';

export default function CreatePayflowWallet() {
  const { profile } = useContext(ProfileContext);
  const { address } = useParams();
  const navigate = useNavigate();

  const [flow, setFlow] = useState<FlowType | null>(null);

  useEffect(() => {
    if (!profile?.flows) {
      toast.error("Wallet doesn't exist");
      return;
    }

    const flow = profile.flows.find((flow) => {
      const isRegularFlow = flow.type === 'REGULAR' || !flow.type;
      const hasBaseWallet = flow.wallets.some((wallet) => wallet.network === base.id);
      const hasMatchingAddress = flow.wallets.some(
        (wallet) => wallet.address.toLowerCase() === address?.toLowerCase()
      );

      return isRegularFlow && hasBaseWallet && hasMatchingAddress;
    });

    if (!flow) {
      toast.error("Wallet doesn't exist");
      return;
    }

    setFlow(flow);
  }, [profile, address]);

  return (
    <>
      <Helmet>
        <title> Payflow | New Session </title>
      </Helmet>
      <Container maxWidth="md" sx={{ height: '100vh' }}>
        <LoadingPayflowEntryLogo />
        {flow && (
          <WalletPermissionsDialog
            open={true}
            onClose={() => {
              navigate('/');
            }}
            flow={flow}
          />
        )}
      </Container>
    </>
  );
}
