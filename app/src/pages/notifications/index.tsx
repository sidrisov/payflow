import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Slider,
  Button
} from '@mui/material';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../utils/urlConstants';
import { SiFarcaster } from 'react-icons/si';
import { green, grey, orange, red } from '@mui/material/colors';

export type CapacityType = 'ALL' | 'CASTS_ONLY';
export type StorageNotificationType = {
  enabled: boolean;
  threshold: number;
  capacityType: CapacityType;
};

export default function NotificationsPage() {
  const [notification, setNotification] = useState<StorageNotificationType>({
    enabled: false,
    threshold: 20,
    capacityType: 'ALL'
  });

  useEffect(() => {
    const fetchStorageNotification = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/farcaster/config/storage/notification`, {
          withCredentials: true
        });

        if (response.data) {
          setNotification(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch storage notification settings:', error);
        toast.error('Failed to load notification settings');
      }
    };

    fetchStorageNotification();
  }, []);

  const handleNotificationUpdate = async () => {
    try {
      await axios.put(`${API_URL}/api/farcaster/config/storage/notification`, notification, {
        withCredentials: true
      });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Failed to update threshold:', error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Notification Settings</Typography>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={handleNotificationUpdate}
          sx={{ borderRadius: 5 }}>
          Update
        </Button>
      </Stack>

      <Card elevation={5} sx={{ mb: 2, borderRadius: 5 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SiFarcaster size={20} />
              <Typography fontSize={18} fontWeight="bold">
                Farcaster Storage
              </Typography>
            </Stack>
            <Switch
              size="small"
              color="default"
              checked={notification.enabled}
              onChange={() => {
                setNotification({ ...notification, enabled: !notification.enabled });
              }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Receive direct cast notification from @payflow when your farcaster storage is about to
            expire or close to the capacity.
          </Typography>

          {notification.enabled && (
            <>
              <FormControl component="fieldset">
                <FormLabel
                  component="legend"
                  sx={{
                    '&.Mui-focused': {
                      color: 'inherit'
                    }
                  }}>
                  Include in capacity check
                </FormLabel>
                <RadioGroup
                  value={notification.capacityType}
                  onChange={(_, value) => {
                    setNotification({ ...notification, capacityType: value as CapacityType });
                  }}>
                  <FormControlLabel
                    value="ALL"
                    control={<Radio color="default" size="small" />}
                    label="Casts, reactions, or followings"
                  />
                  <FormControlLabel
                    value="CASTS_ONLY"
                    control={<Radio color="default" size="small" />}
                    label="Casts only"
                  />
                </RadioGroup>
              </FormControl>

              <FormControl
                component="fieldset"
                sx={{ py: 1, px: 2, border: 1, borderRadius: 5, borderColor: 'divider' }}>
                <FormLabel component="legend" sx={{ px: 1 }}>
                  Usage threshold
                </FormLabel>
                <Slider
                  value={notification.threshold}
                  onChange={(_, value) => {
                    setNotification({ ...notification, threshold: value as number });
                  }}
                  aria-labelledby="threshold-slider"
                  min={0}
                  max={30}
                  marks={[
                    { value: 5, label: '5%' },
                    { value: 15, label: '15%' },
                    { value: 25, label: '25%' }
                  ]}
                  sx={{
                    '& .MuiSlider-thumb, & .MuiSlider-track': {
                      color:
                        notification.threshold <= 10
                          ? red.A700
                          : notification.threshold <= 20
                          ? orange.A700
                          : green.A700
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: grey.A700
                    }
                  }}
                />
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    You'll be notified when storage usage reaches <b>{notification.threshold}%</b>{' '}
                    of last unit's capacity.
                  </Typography>
                </Stack>
              </FormControl>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
