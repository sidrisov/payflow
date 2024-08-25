import { Container, Stack } from '@mui/material';
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
import CenteredCircularProgress from '../components/CenteredCircularProgress';

export default function Payment() {
  const navigate = useNavigate();

  const { refId } = useParams();

  const { isAuthenticated, profile } = useContext(ProfileContext);

  const { flows } = profile ?? { flows: [] };
  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  const [payment, setPayment] = useState<PaymentType>();
  const [paymentSocial, setPaymentSocial] = useState<Social>();

  useEffect(() => {
    if (!profile) {
      navigate('/search');
    }
  }, []);

  useEffect(() => {
    if (!selectedFlow && flows && flows.length > 0) {
      setSelectedFlow(flows.find((f) => f.uuid === profile?.defaultFlow?.uuid) ?? flows[0]);
    }
  }, [selectedFlow, flows]);

  useEffect(() => {
    const fetchData = async () => {
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
            }
            // Update payment state
            setPayment(paymentData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    if (profile) {
      fetchData();
    }
  }, [profile, refId, payment]);

  return (
    <>
      <Helmet>
        <title> Payflow | Payment </title>
      </Helmet>
      <Container maxWidth="md">
        {isAuthenticated && profile && payment && flows && selectedFlow ? (
          <Stack alignItems="center" spacing={1}>
            {payment.status === 'PENDING' &&
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
                payment.category === 'fc_storage' &&
                paymentSocial && (
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
                )
              ))}
          </Stack>
        ) : (
          <CenteredCircularProgress />
        )}
      </Container>
    </>
  );
}
