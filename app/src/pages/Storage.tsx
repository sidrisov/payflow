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
  Button,
  Divider
} from '@mui/material';
import { useState, useEffect, useMemo, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { SiFarcaster } from 'react-icons/si';
import { green, grey, orange, red } from '@mui/material/colors';
import { BUY_STORAGE_FRAME_VERSION, PaymentType } from '@payflow/common';
import FrameV2SDK from '@farcaster/frame-sdk';
import { ProfileContext } from '../contexts/UserContext';
import { useLoaderData, useNavigate } from 'react-router';
import BuyStorageDialog from '../components/payment/BuyStorageDialog';
import { optimism } from 'viem/chains';
import { useFarcasterSocial } from '@/hooks/useFarcasterSocial';

export type CapacityType = 'ALL' | 'CASTS_ONLY';
export type StorageNotificationType = {
  enabled: boolean;
  threshold: number;
  capacityType: CapacityType;
  notifyWithMessage: boolean;
  notifyWithCast: boolean;
};

type UsageBarProps = {
  label: string;
  value: number;
};

const UsageBar = ({ label, value }: UsageBarProps) => {
  return (
    <Stack alignItems="center" spacing={1} sx={{ flex: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ width: '100%', bgcolor: grey.A400, borderRadius: 0.5, height: 5 }}>
        <Box
          sx={{
            width: `${value}%`,
            height: '100%',
            bgcolor: value <= 75 ? green.A700 : value <= 85 ? orange.A700 : red.A700,
            borderRadius: 0.5
          }}
        />
      </Box>
      <Typography variant="subtitle2" color="text.secondary">
        {value}%
      </Typography>
    </Stack>
  );
};

type StorageData = {
  user: { fid: number };
  total_active_units: number;
  soon_expire_units: number;
  casts: {
    used: number;
    capacity: number;
  };
  reactions: {
    used: number;
    capacity: number;
  };
  links: {
    used: number;
    capacity: number;
  };
};

export async function loader() {
  try {
    const [notificationResponse, storageResponse] = await Promise.all([
      axios.get(`${API_URL}/api/farcaster/config/storage/notification`, {
        withCredentials: true
      }),
      axios.get(`${API_URL}/api/user/me/storage`, {
        withCredentials: true
      })
    ]);

    return {
      notification: notificationResponse.data || null,
      storage: storageResponse.data
    };
  } catch (error) {
    console.error('Failed to fetch storage data:', error);
    throw new Error('Failed to load storage information');
  }
}

export default function Storage() {
  const navigate = useNavigate();

  const { isFrameV2, profile } = useContext(ProfileContext);
  const { social: recipientSocial } = useFarcasterSocial(profile?.identity);

  const { storage, notification: loadedNotification } = useLoaderData<{
    notification: StorageNotificationType | null;
    storage: StorageData | null;
  }>();

  const [notification, setNotification] = useState<StorageNotificationType>(
    loadedNotification ?? {
      enabled: false,
      threshold: 20,
      capacityType: 'ALL',
      notifyWithMessage: true,
      notifyWithCast: true
    }
  );

  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  const shareComposeDeeplink = useMemo(() => {
    if (!storage?.user?.fid) return '';

    const baseUrl = 'https://warpcast.com/~/compose';
    const castText = encodeURIComponent(
      `Buy Farcaster Storage via @payflow frame\ncc: @sinaver.eth /payflow`
    );
    const embedUrl = `https://app.payflow.me/~/farcaster/storage?${BUY_STORAGE_FRAME_VERSION}`;

    return `${baseUrl}?text=${castText}&embeds[]=${encodeURIComponent(embedUrl)}`;
  }, [storage?.user?.fid]);

  useEffect(() => {
    if (!profile) {
      navigate(`/connect?redirect=/~/farcaster/storage`);
    }
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

  // Calculate percentages
  const getUsagePercentage = (used: number, capacity: number) => {
    return Math.round((used / capacity) * 100);
  };

  return (
    <>
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Card elevation={5} sx={{ mb: 2, borderRadius: 5 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SiFarcaster size={20} />
              <Typography fontSize={18} fontWeight="bold">
                Farcaster Storage ({storage?.total_active_units ?? 0} units)
              </Typography>
            </Stack>

            <Stack direction="row" sx={{ mb: 2, width: '100%' }} spacing={1}>
              <UsageBar
                label="Casts"
                value={storage ? getUsagePercentage(storage.casts.used, storage.casts.capacity) : 0}
              />
              <UsageBar
                label="Reactions"
                value={
                  storage
                    ? getUsagePercentage(storage.reactions.used, storage.reactions.capacity)
                    : 0
                }
              />
              <UsageBar
                label="Links"
                value={storage ? getUsagePercentage(storage.links.used, storage.links.capacity) : 0}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setIsBuyDialogOpen(true)}
                sx={{ borderRadius: 3, mb: 2, ml: 'auto' }}>
                Buy storage
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                disabled={!shareComposeDeeplink}
                onClick={() => {
                  if (isFrameV2) {
                    FrameV2SDK.actions.openUrl(shareComposeDeeplink);
                  } else {
                    window.open(shareComposeDeeplink, '_blank');
                  }
                }}
                sx={{ borderRadius: 3, mb: 2, ml: 'auto' }}>
                Share
              </Button>
            </Stack>

            <Divider />

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ justifyContent: 'space-between', mb: 2 }}>
              <Typography fontSize={16} fontWeight="bold" color="text.secondary">
                Enable notifications
              </Typography>
              <Switch
                color="default"
                checked={notification.enabled}
                onChange={() => {
                  setNotification({ ...notification, enabled: !notification.enabled });
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: green.A700
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: green.A700
                  }
                }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Receive notification from @payflow when your farcaster storage is about to expire or
              close to the capacity.
            </Typography>

            {notification.enabled && (
              <Stack direction="column" spacing={1}>
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
                      of 1 unit's capacity.
                    </Typography>
                  </Stack>
                </FormControl>

                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      '&.Mui-focused': {
                        color: 'inherit'
                      }
                    }}>
                    Notification methods
                  </FormLabel>
                  <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          color="default"
                          checked={notification.notifyWithMessage}
                          onChange={() => {
                            if (notification.notifyWithMessage && !notification.notifyWithCast) {
                              return;
                            }
                            setNotification({
                              ...notification,
                              notifyWithMessage: !notification.notifyWithMessage
                            });
                          }}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: green.A700
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: green.A700
                            }
                          }}
                        />
                      }
                      label="Notify with message"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          color="default"
                          checked={notification.notifyWithCast}
                          onChange={() => {
                            if (notification.notifyWithCast && !notification.notifyWithMessage) {
                              return;
                            }
                            setNotification({
                              ...notification,
                              notifyWithCast: !notification.notifyWithCast
                            });
                          }}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: green.A700
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: green.A700
                            }
                          }}
                        />
                      }
                      label="Notify with cast reply"
                    />
                  </Stack>
                </FormControl>
              </Stack>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleNotificationUpdate}
              sx={{ borderRadius: 3, mt: 2, ml: 'auto' }}>
              Update
            </Button>
          </CardContent>
        </Card>
      </Box>

      {isBuyDialogOpen && profile && recipientSocial && (
        <BuyStorageDialog
          open={isBuyDialogOpen}
          onClose={() => setIsBuyDialogOpen(false)}
          closeStateCallback={() => setIsBuyDialogOpen(false)}
          sender={{
            identity: {
              profile,
              address: profile?.identity
            },
            type: 'profile'
          }}
          payment={
            {
              type: 'APP',
              status: 'CREATED',
              category: 'fc_storage',
              receiver: profile,
              receiverAddress: profile.identity,
              receiverFid: parseInt(recipientSocial.profileId),
              chainId: optimism.id,
              token: 'eth',
              tokenAmount: 1
            } as PaymentType
          }
          recipientSocial={recipientSocial}
        />
      )}
    </>
  );
}
