import { Container } from '@mui/material';
import { lazy, useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import { useNavigate, useParams } from 'react-router';
import { PaymentType, SocialInfoType } from '@payflow/common';
import { fetchPayment } from '../services/payments';
import { IdentityType, SelectedIdentityType } from '@payflow/common';
import { toast } from 'react-toastify';
import { statusToToastType } from '../components/Toasts';
import { fetchMintData, MintMetadata, parseMintToken } from '../utils/mint';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { fetchHypersubData, HypersubData } from '../utils/hooks/useHypersub';
import { useFarcasterSocial } from '@/hooks/useFarcasterSocial';

const LazyMintDialog = lazy(() => import('../components/payment/MintDialog'));
const LazySubscribeToHypersubDialog = lazy(() => import('../components/payment/HypersubDialog'));
const LazyGiftStorageDialog = lazy(() => import('../components/payment/BuyStorageDialog'));
const LazyPaymentDialog = lazy(() => import('../components/payment/PaymentDialog'));

export default function Payment() {
  const navigate = useNavigate();

  const { refId } = useParams();
  const { profile } = useContext(ProfileContext);

  const [payment, setPayment] = useState<PaymentType>();
  const [mintData, setMintData] = useState<MintMetadata>();
  const [hypersubData, setHypersubData] = useState<HypersubData | null>(null);

  const sender = {
    identity: {
      profile,
      address: profile?.identity
    },
    type: 'profile'
  } as SelectedIdentityType;

  useEffect(() => {
    if (!profile) {
      navigate(`/connect?redirect=/payment/${refId}`);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (refId && !payment) {
        try {
          // Fetch payment data
          const paymentData = await fetchPayment(refId);

          if (paymentData) {
            if (
              paymentData.status !== 'CREATED' &&
              paymentData.status !== 'COMPLETED' &&
              paymentData.status !== 'FAILED'
            ) {
              toast(`Payment ${paymentData.status}!`, {
                autoClose: 3000,
                type: statusToToastType[paymentData.status] || 'default'
              });
              return;
            }

            if (paymentData.receiverFid) {
              if (paymentData.category === 'mint') {
                const parsedMintData = parseMintToken(paymentData.token);
                const mintData = await fetchMintData(
                  parsedMintData.provider,
                  paymentData.chainId,
                  parsedMintData.contract,
                  parsedMintData.tokenId,
                  parsedMintData.referral
                );
                setMintData(mintData);
              }

              if (paymentData.category === 'hypersub') {
                const hypersubData = await fetchHypersubData(paymentData);
                setHypersubData(hypersubData);
              }
            }

            // Update payment state
            setPayment(paymentData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    fetchData();
  }, [refId, payment]);

  const { social: recipientSocial } = useFarcasterSocial(
    profile?.identity ?? payment?.receiverAddress,
    payment?.receiverFid?.toString()
  );
  const { social: senderSocial } = useFarcasterSocial(profile?.identity ?? payment?.senderAddress);

  // specify height, otherwise the privy dialog won't be properly displayed
  return (
    <>
      <Helmet>
        <title> Payflow | Payment </title>
      </Helmet>
      <Container maxWidth="md" sx={{ height: '100vh' }}>
        <LoadingPayflowEntryLogo />
        {profile &&
          payment &&
          (!payment.category ||
          payment.category === 'reward' ||
          payment.category === 'reward_top_reply' ||
          payment.category === 'reward_top_casters' ? (
            <LazyPaymentDialog
              alwaysShowBackButton
              title="Complete Payment"
              open={payment != null}
              paymentType="payflow"
              payment={payment}
              sender={{
                identity: {
                  profile,
                  address: profile.identity
                },
                type: 'profile'
              }}
              recipient={
                {
                  identity: {
                    ...(payment.receiver
                      ? {
                          profile: {
                            ...payment.receiver,
                            ...(payment.receiverFlow && { defaultFlow: payment.receiverFlow })
                          }
                        }
                      : {
                          address: payment.receiverAddress
                        })
                  } as IdentityType,
                  type: payment.receiver ? 'profile' : 'address'
                } as SelectedIdentityType
              }
              closeStateCallback={async () => {
                navigate('/');
              }}
            />
          ) : (
            senderSocial &&
            recipientSocial &&
            ((payment.category === 'fc_storage' && (
              <LazyGiftStorageDialog
                alwaysShowBackButton
                title="Complete Payment"
                open={payment != null}
                payment={payment}
                sender={sender}
                recipientSocial={recipientSocial}
                closeStateCallback={async () => {
                  navigate('/');
                }}
              />
            )) ||
              (payment.category === 'mint' && mintData && (
                <LazyMintDialog
                  alwaysShowBackButton
                  title="Complete Payment"
                  open={payment != null}
                  payment={payment}
                  sender={sender}
                  senderSocial={senderSocial}
                  recipientSocial={recipientSocial}
                  mint={mintData}
                  closeStateCallback={async () => {
                    navigate('/');
                  }}
                />
              )) ||
              (payment.category === 'hypersub' &&
                hypersubData &&
                senderSocial &&
                recipientSocial && (
                  <LazySubscribeToHypersubDialog
                    alwaysShowBackButton
                    title="Complete Payment"
                    open={payment != null}
                    payment={payment}
                    sender={sender}
                    senderSocial={senderSocial}
                    recipientSocial={recipientSocial}
                    hypersub={hypersubData}
                    closeStateCallback={async () => {
                      navigate('/');
                    }}
                  />
                )))
          ))}
      </Container>
    </>
  );
}
