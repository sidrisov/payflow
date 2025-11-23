import { useContext, useEffect, useState } from 'react';
import { Container } from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { ProfileContext } from '../contexts/UserContext';
import { PaymentType, SelectedIdentityType } from '@payflow/common';
import { Address } from 'viem';
import { useIdentity } from '../utils/queries/profiles';
import PaymentDialog from '../components/payment/PaymentDialog';
import { base } from 'viem/chains';

export default function Composer() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const recipientIdentity = searchParams.get('recipient');
  const chainId = searchParams.get('chainId');
  const token = searchParams.get('token');
  const tokenAmount = searchParams.get('tokenAmount');

  const { isLoading: isRecipientFetchingLoading, data: fetchedRecipientIdentity } = useIdentity(
    recipientIdentity as string
  );

  const { profile } = useContext(ProfileContext);
  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(!recipientIdentity);

  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  useEffect(() => {
    if (recipientIdentity && !recipient) {
      if (profile) {
        const ownWallet = profile.flows?.find((flow) =>
          flow.wallets?.find(
            (wallet) => wallet.address.toLowerCase() === recipientIdentity.toLowerCase()
          )
        );

        if (ownWallet) {
          setRecipient({
            identity: {
              address: profile.identity,
              profile: { ...profile, defaultFlow: ownWallet }
            },
            type: 'profile'
          });
          return;
        }
      }

      if (fetchedRecipientIdentity) {
        setRecipient({
          identity: fetchedRecipientIdentity,
          type: fetchedRecipientIdentity.profile ? 'profile' : 'address'
        });
      }
    }
  }, [recipient, isRecipientFetchingLoading, recipientIdentity, fetchedRecipientIdentity, profile]);

  return (
    <>
      <title>Payflow | New Payment</title>

      <Container maxWidth="md" sx={{ height: '80vh' }}>
        {recipient && profile && (
          <PaymentDialog
            open={recipient != null}
            paymentType="payflow"
            payment={
              {
                referenceId: '123',
                type: 'APP',
                status: 'CREATED',
                category: 'fc_storage',
                receiver: recipient.identity.profile,
                receiverAddress: recipient.identity.address,
                chainId: chainId ?? base.id,
                token: token ?? 'usdc',
                tokenAmount: tokenAmount ? parseInt(tokenAmount) : 10
              } as PaymentType
            }
            sender={{
              type: 'profile',
              identity: {
                address: profile.identity as Address,
                profile: profile
              }
            }}
            recipient={recipient}
            setOpenSearchIdentity={setOpenSearchIdentity}
            closeStateCallback={async () => {
              setRecipient(undefined);
              navigate(-1);
            }}
          />
        )}

        {openSearchIdentity && profile && (
          <SearchIdentityDialog
            hideBackButton={!Boolean(recipient)}
            title="Search Recipient"
            address={profile.identity}
            open={openSearchIdentity}
            closeStateCallback={() => {
              setOpenSearchIdentity(false);
            }}
            selectIdentityCallback={async (recipient) => {
              setRecipient(recipient);
            }}
          />
        )}
      </Container>
    </>
  );
}
