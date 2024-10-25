import { AutoAwesome, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Stack,
  Box,
  Chip,
  Typography,
  IconButton,
  NativeSelect,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useState, useEffect } from 'react';
import { PaymentCategory } from '../types/PaymentType';
import { QuantitySelector } from './payment/QuantitySelector';
import { ChannelSelector } from './dialogs/ChannelSelector';
import { HypersubSelector } from './dialogs/HypersubSelector';

export interface RewardCriteria {
  label: string;
  placeholder: string;
  value: string;
  required: boolean;
  enabled?: boolean;
}

export function RewardAdvancedSection({
  type,
  setType,
  numberOfRewards,
  setNumberOfRewards,
  setExtraParams
}: {
  type: PaymentCategory;
  setType: React.Dispatch<React.SetStateAction<PaymentCategory>>;
  numberOfRewards: number;
  setNumberOfRewards: React.Dispatch<React.SetStateAction<number>>;
  setExtraParams: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [expand, setExpand] = useState<boolean>(false);

  const [rewardCriteria, setRewardCriteria] = useState<Record<string, RewardCriteria>>({
    hypersub: {
      label: 'Hypersub',
      placeholder: 'Contract Address',
      value: '',
      enabled: false,
      required: false
    } as RewardCriteria
  });

  useEffect(() => {
    Object.entries(rewardCriteria).forEach(([key, criteria]) => {
      setExtraParams((prev) => ({
        ...prev,
        [key]: criteria.enabled ? criteria.value : ''
      }));
    });
  }, [rewardCriteria]);

  return (
    <Stack width="100%">
      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Chip
          icon={<AutoAwesome fontSize="small" />}
          label="Advanced"
          variant="outlined"
          sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
        />
        <IconButton size="small" onClick={() => setExpand(!expand)}>
          {expand ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      {expand && (
        <>
          <Box
            mt={1}
            p={2}
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            gap={1}
            sx={{ borderRadius: 5, border: 1, borderColor: 'divider' }}>
            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography fontSize={13} fontWeight="bold">
                Reward Type
              </Typography>
              <NativeSelect
                variant="outlined"
                disableUnderline
                value={type}
                onChange={(event) => {
                  setType(event.target.value as PaymentCategory);
                }}
                inputMode="text"
                sx={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  '& .MuiNativeSelect-select': {
                    textAlign: 'right'
                  }
                }}>
                <option value="reward">Any Cast</option>
                <option value="reward_top_reply">
                  <Typography>Top Comment</Typography>
                </option>
                <option value="reward_top_casters">
                  <Typography>Top Casters</Typography>
                </option>
              </NativeSelect>
            </Box>
            <Typography
              variant="caption"
              fontWeight="bold"
              textAlign="center"
              sx={{
                p: 1,
                color: 'text.secondary',
                textWrap: 'balance'
              }}>
              {type === 'reward' ? (
                'Rewards selected cast author'
              ) : type === 'reward_top_reply' ? (
                <>
                  Rewards the author of top comment in the selected cast (based on{' '}
                  <b>
                    <a
                      href="https://docs.airstack.xyz/airstack-docs-and-faqs/abstractions/trending-casts/social-capital-value-and-social-capital-scores"
                      target="_blank"
                      style={{ color: 'inherit' }}>
                      Airstack's Cast Scores
                    </a>
                  </b>
                  )
                </>
              ) : (
                'Rewards top casters within 7d period in the channel or globally based on configured user criteria (e.g. hypersub subscriber)'
              )}
            </Typography>

            {type === 'reward_top_casters' && (
              <>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography fontSize={13} fontWeight="bold">
                    Number of rewards
                  </Typography>
                  <QuantitySelector
                    quantity={numberOfRewards}
                    setQuantity={setNumberOfRewards}
                    min={1}
                    max={10}
                  />
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography fontSize={13} fontWeight="bold">
                    Casts in
                  </Typography>
                  <ChannelSelector
                    onChannelSelect={(channel) => {
                      setExtraParams((prev) => ({
                        ...prev,
                        channel: channel?.channelId || ''
                      }));
                    }}
                  />
                </Box>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="flex-start"
                  alignItems="stretch"
                  gap={1}>
                  <Typography fontSize={13} fontWeight="bold" mb={1}>
                    User Criteria
                  </Typography>
                  <Box
                    sx={{
                      ml: 1,
                      borderLeft: 2,
                      borderColor: 'divider'
                    }}>
                    {Object.entries(rewardCriteria).map(([key, criteria]) => (
                      <Box
                        key={key}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1 }}>
                        <FormControlLabel
                          labelPlacement="top"
                          slotProps={{
                            typography: {
                              sx: { fontSize: 12, fontWeight: 'bold' }
                            }
                          }}
                          control={
                            criteria.required ? (
                              <></>
                            ) : (
                              <Switch
                                checked={criteria.enabled}
                                onChange={(e) => {
                                  setRewardCriteria((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...prev[key],
                                      enabled: e.target.checked,
                                      value: e.target.checked ? prev[key].value : ''
                                    }
                                  }));
                                }}
                                size="small"
                                color="default"
                              />
                            )
                          }
                          label={criteria.label}
                        />
                        {key === 'hypersub' ? (
                          <HypersubSelector
                            disabled={!criteria.enabled}
                            onHypersubSelect={(hypersub) => {
                              setRewardCriteria((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  value: hypersub?.hypersubId || ''
                                }
                              }));
                            }}
                          />
                        ) : (
                          <TextField
                            value={criteria.value}
                            onChange={(e) => {
                              setRewardCriteria((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], value: e.target.value }
                              }));
                            }}
                            disabled={!criteria.enabled}
                            sx={{
                              width: '50%',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 5,
                                borderColor: 'divider',
                                height: 40,
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'text.primary',
                                  borderWidth: 1
                                }
                              }
                            }}
                            size="small"
                            placeholder={criteria.placeholder}
                            slotProps={{
                              input: {
                                sx: { fontSize: 12, fontWeight: 'bold' }
                              }
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
