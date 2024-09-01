import { Container } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import { FlowType } from '../types/FlowType';
import { useNavigate, useParams } from 'react-router-dom';
import { PaymentType } from '../types/PaymentType';
import { fetchPayment } from '../services/payments';
import { fetchQuery } from '@airstack/airstack-react';
import { QUERY_FARCASTER_PROFILE } from '../utils/airstackQueries';
import { GetFarcasterProfileQuery, Social } from '../generated/graphql/types';
import GiftStorageDialog from '../components/dialogs/GiftStorageDialog';
import PaymentDialog from '../components/dialogs/PaymentDialog';
import { IdentityType, SelectedIdentityType } from '../types/ProfileType';
import { toast } from 'react-toastify';
import { statusToToastType } from '../components/Toasts';
import { fetchMintData, MintMetadata } from '../utils/mint';
import { Address } from 'viem';
import MintDialog from '../components/dialogs/MintDialog';

export default function Payment() {
  const navigate = useNavigate();

  const { refId } = useParams();
  const { profile } = useContext(ProfileContext);

  const { flows } = profile ?? { flows: [] };
  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  const [payment, setPayment] = useState<PaymentType>();
  const [paymentSocial, setPaymentSocial] = useState<Social>();
  const [mintData, setMintData] = useState<MintMetadata>();

  useEffect(() => {
    if (!profile) {
      navigate(`/connect?redirect=/payment/${refId}`);
    }
  }, []);

  useEffect(() => {
    if (!selectedFlow && flows && flows.length > 0) {
      setSelectedFlow(flows.find((f) => f.uuid === profile?.defaultFlow?.uuid) ?? flows[0]);
    }
  }, [selectedFlow, flows]);

  useEffect(() => {
    const fetchData = async () => {
      type ParsedMintData = {
        provider: string;
        contract: Address;
        tokenId?: number;
        referral?: Address;
      };

      function parseMintToken(token: string): ParsedMintData {
        const [provider, contract, tokenId] = token.split(':');
        return {
          provider,
          contract: contract as Address,
          tokenId: tokenId ? parseInt(tokenId) : undefined
        };
      }

      if (refId && !payment) {
        try {
          // Fetch payment data
          const paymentData = await fetchPayment(refId);
          if (paymentData) {
            if (paymentData.receiverFid) {
              // Fetch Farcaster profile data
              const { data } = await fetchQuery<GetFarcasterProfileQuery>(
                QUERY_FARCASTER_PROFILE,
                { fid: paymentData.receiverFid.toString() },
                { cache: true }
              );

              // Update social information if available
              const social = data?.Socials?.Social?.[0];
              if (social) {
                setPaymentSocial(social as Social);
              }

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
            }

            if (paymentData.status !== 'PENDING') {
              toast(`Payment ${paymentData.status}!`, {
                autoClose: 3000,
                type: statusToToastType[paymentData.status] || 'default'
              });
              return;
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

  // specify height, otherwise the privy dialog won't be properly displayed
  return (
    <>
      <Helmet>
        <title> Payflow | Payment </title>
      </Helmet>
      <Container maxWidth="md" sx={{ height: '100vh' }}>
        {profile &&
          payment &&
          flows &&
          selectedFlow &&
          (!payment.category ? (
            <PaymentDialog
              alwaysShowBackButton
              title="Complete Payment"
              open={payment != null}
              paymentType="payflow"
              payment={payment}
              sender={{
                identity: {
                  profile: { ...profile, defaultFlow: selectedFlow },
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
              flows={flows}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
            />
          ) : (
            paymentSocial &&
            ((payment.category === 'fc_storage' && (
              <GiftStorageDialog
                alwaysShowBackButton
                title="Complete Storage Payment"
                open={payment != null}
                payment={payment}
                sender={{
                  identity: {
                    profile: { ...profile, defaultFlow: selectedFlow },
                    address: profile.identity
                  },
                  type: 'profile'
                }}
                social={paymentSocial}
                closeStateCallback={async () => {
                  navigate('/');
                }}
                flows={flows}
                selectedFlow={selectedFlow}
                setSelectedFlow={setSelectedFlow}
              />
            )) ||
              (payment.category === 'mint' && mintData && (
                <MintDialog
                  alwaysShowBackButton
                  title="Complete Mint Payment"
                  open={payment != null}
                  payment={payment}
                  sender={{
                    identity: {
                      profile: { ...profile, defaultFlow: selectedFlow },
                      address: profile.identity
                    },
                    type: 'profile'
                  }}
                  social={paymentSocial}
                  mint={mintData}
                  closeStateCallback={async () => {
                    navigate('/');
                  }}
                  flows={flows}
                  selectedFlow={selectedFlow}
                  setSelectedFlow={setSelectedFlow}
                />
              )))
          ))}
      </Container>
    </>
  );
}
