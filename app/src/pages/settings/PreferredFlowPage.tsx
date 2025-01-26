import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { green } from '@mui/material/colors';
import { HiOutlineDownload } from 'react-icons/hi';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { ProfileContext } from '../../contexts/UserContext';
import { FlowType } from '@payflow/common';
import { PaymentFlowSection } from '../../components/PaymentFlowSection';
import { setReceivingFlow } from '../../services/flow';
import { delay } from '../../utils/delay';
import { toast } from 'react-toastify';

export default function PreferredFlowPage() {
  const { profile } = useContext(ProfileContext);
  const [selectedFlow, setSelectedFlow] = useState<FlowType | null>(
    () => profile?.defaultFlow || null
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.defaultFlow) setSelectedFlow(profile.defaultFlow);
  }, [profile]);

  const { regular = [], farcaster = [] } = profile?.flows
    ? profile.flows.reduce(
        (acc, flow) => {
          if (flow.archived) return acc;
          if (flow.type === 'FARCASTER_VERIFICATION') {
            acc.farcaster.push(flow);
          } else if (flow.wallets.length > 0 && !flow.wallets.some((w) => w.version === '1.3.0')) {
            acc.regular.push(flow);
          }
          return acc;
        },
        { regular: [], farcaster: [] } as { regular: FlowType[]; farcaster: FlowType[] }
      )
    : {};

  const updatePreferredFlow = async () => {
    if (!selectedFlow) return;
    try {
      if (await setReceivingFlow(selectedFlow.uuid)) {
        toast.success('Updated! Reloading', { isLoading: true });
        await delay(1000);
        navigate(0);
      } else {
        toast.error('Something went wrong!');
      }
    } catch (error) {
      toast.error('Failed to save preferred flow');
    }
  };

  const renderFlowSection = (flows: FlowType[], title: string) =>
    flows.length > 0 && (
      <Stack>
        <Typography variant="subtitle2" sx={{ px: 1, py: 1, color: 'text.secondary' }}>
          {title}
        </Typography>
        <Stack spacing={1}>
          {flows.map((flow) => (
            <Box
              key={flow.uuid}
              onClick={() => setSelectedFlow(flow)}
              sx={{
                cursor: 'pointer',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                p: 2
              }}>
              <Box display="flex" alignItems="center" gap={2}>
                {selectedFlow?.uuid === flow.uuid ? (
                  <FaCheckCircle color={green[500]} size={18} />
                ) : (
                  <FaRegCircle size={18} />
                )}
                <PaymentFlowSection flow={flow} />
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    );

  if (!profile) return null;

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HiOutlineDownload size={30} />
            <Typography variant="h6">Preferred Payment Flow</Typography>
          </Stack>

          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Choose your preferred payment flow for receiving and completing payments
          </Typography>

          <Stack
            spacing={3}
            sx={{
              height: '400px',
              overflowY: 'scroll',
              px: 0.5,
              '&::-webkit-scrollbar': {
                width: '5px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.divider,
                borderRadius: '4px'
              }
            }}>
            {renderFlowSection(regular, 'Native')}
            {renderFlowSection(farcaster, 'Farcaster Verified')}
          </Stack>

          <Button
            variant="outlined"
            onClick={updatePreferredFlow}
            disabled={!selectedFlow}
            sx={{ px: 3 }}>
            Update
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
