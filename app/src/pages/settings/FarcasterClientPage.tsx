import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Container, Stack, Box, Typography, Button, IconButton } from '@mui/material';
import { Launch as LaunchIcon } from '@mui/icons-material';
import { SiFarcaster } from 'react-icons/si';
import { green } from '@mui/material/colors';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_CLIENTS, FarcasterClient } from '@payflow/common';
import axios from 'axios';
import { API_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';
import { delay } from '../../utils/delay';
import { FarcasterClientAvatar } from '../../components/avatars/FarcasterClientAvatar';

export default function FarcasterClientPage() {
  const { profile } = useContext(ProfileContext);
  const [selectedClient, setSelectedClient] = useState<FarcasterClient>(
    () => profile?.preferredFarcasterClient || 'WARPCAST'
  );
  const navigate = useNavigate();

  const renderClientOption = (
    client: (typeof FARCASTER_CLIENTS)[0],
    onSelect: (id: FarcasterClient) => void
  ) => (
    <Box
      key={client.id}
      onClick={() => onSelect(client.id.toUpperCase() as FarcasterClient)}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 2
      }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
          {selectedClient.toLowerCase() === client.id ? (
            <FaCheckCircle color={green[500]} size={18} />
          ) : (
            <FaRegCircle size={18} />
          )}
          <FarcasterClientAvatar image={client.image} name={client.name} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight="bold">{client.name}</Typography>
            <Typography fontSize={14} color="text.secondary">
              {client.description}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            window.open(client.url, '_blank');
          }}
          sx={{ ml: 2, flexShrink: 0 }}>
          <LaunchIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  const updateClient = async (client: FarcasterClient) => {
    try {
      const response = await axios.put(`${API_URL}/api/farcaster/config/client`, client, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.status === 200) {
        toast.success('Updated! Refreshing', { isLoading: true });
        await delay(1000);
        navigate(0);
      } else {
        toast.error('Something went wrong!');
      }
    } catch (error) {
      toast.error('Failed to save preferred tokens');
    }
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ my: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SiFarcaster size={30} />
          <Typography variant="h6">Preferred Farcaster Client</Typography>
        </Stack>

        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Choose your preferred farcaster client for client specific operations
        </Typography>

        <Stack spacing={1}>
          {FARCASTER_CLIENTS.map((client) => renderClientOption(client, setSelectedClient))}
        </Stack>

        <Button variant="outlined" onClick={() => updateClient(selectedClient)}>
          Update
        </Button>
      </Stack>
    </Container>
  );
}
