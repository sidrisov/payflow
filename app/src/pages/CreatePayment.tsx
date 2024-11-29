import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { ProfileContext } from '../contexts/UserContext';
import { SelectedIdentityType } from '../types/ProfileType';
import { Address } from 'viem';
import { useIdentity } from '../utils/queries/profiles';
import PaymentDialog from '../components/payment/PaymentDialog';

export default function Composer() {
  const [searchParams] = useSearchParams();
  const recipientIdentity = searchParams.get('recipient');

  const { isLoading: isRecipientFetchingLoading, data: fetchedRecipientIdentity } = useIdentity(
    recipientIdentity as string
  );

  const { profile } = useContext(ProfileContext);
  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(!recipientIdentity);

  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  useEffect(() => {
    if (fetchedRecipientIdentity) {
      setRecipient({
        identity: fetchedRecipientIdentity,
        type: fetchedRecipientIdentity.profile ? 'profile' : 'address'
      });
    }
  }, [isRecipientFetchingLoading, fetchedRecipientIdentity]);

  return (
    <>
      <Helmet>
        <title> Payflow | New Payment </title>
      </Helmet>

      <Container maxWidth="md" sx={{ height: '80vh' }}>
        {recipient && profile && (
          <PaymentDialog
            open={recipient != null}
            paymentType="payflow"
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
            }}
          />
        )}
        {/* {recipient && profile && (
          <PayComposerActionDialog
            open={recipient != null}
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
            }}
          />
        )}
 */}
        {openSearchIdentity && profile && (
          <SearchIdentityDialog
            hideBackButton={!Boolean(recipient)}
            title="Search Recipient"
            address={profile.identity}
            open={openSearchIdentity}
            closeStateCallback={async () => {
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
