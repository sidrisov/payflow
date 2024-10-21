import { AutoAwesome, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Stack,
  Box,
  Chip,
  Typography,
  IconButton,
  NativeSelect,
  TextField,
  Switch
} from '@mui/material';
import { useState, useEffect } from 'react';
import { Type } from '../types/PaymentType';
import { grey } from '@mui/material/colors';
import { QuantitySelector } from './payment/QuantitySelector';

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
  rewardCriterias,
  setRewardCriterias
}: {
  type: Type;
  setType: React.Dispatch<React.SetStateAction<Type>>;
  numberOfRewards: number;
  setNumberOfRewards: React.Dispatch<React.SetStateAction<number>>;
  rewardCriterias: Record<string, RewardCriteria>;
  setRewardCriterias: React.Dispatch<React.SetStateAction<Record<string, RewardCriteria>>>;
}) {
  const [expand, setExpand] = useState<boolean>(false);

  useEffect(() => {
    if (Object.keys(rewardCriterias).length === 0) {
      setRewardCriterias({
        channel: {
          label: 'Channel',
          placeholder: 'Channel Name',
          value: '',
          required: true
        } as RewardCriteria
        /*  hypersub: {
          label: 'Hypersub',
          placeholder: 'Subscription Address',
          value: '',
          enabled: false
        } as RewardCriteria,
        fan_token: {
          label: 'Fan Token',
          placeholder: 'Token Name',
          value: '',
          enabled: false
        } as RewardCriteria */
      });
    }
  }, []);

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
            alignItems="stretch"
            justifyContent="flex-start"
            gap={0.5}
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
                  setType(event.target.value as Type);
                }}
                inputMode="text"
                sx={{ fontSize: 13, fontWeight: 'bold' }}>
                <option value="REWARD">Regular</option>
                <option value="REWARD_TOP_REPLY">
                  <Typography>Top Comment</Typography>
                </option>
                <option value="REWARD_TOP_CASTERS">
                  <Typography>Top Casters</Typography>
                </option>
              </NativeSelect>
            </Box>
            <Typography
              variant="caption"
              fontWeight="bold"
              maxWidth={300}
              textAlign="center"
              sx={{ p: 2, borderColor: 'divider', color: grey[400] }}>
              {type === 'REWARD' ? (
                'Rewards selected cast author'
              ) : type === 'REWARD_TOP_REPLY' ? (
                <>
                  Rewards the author of top comment in the selected cast, based on{' '}
                  <b>
                    <a
                      href="https://docs.airstack.xyz/airstack-docs-and-faqs/abstractions/trending-casts/social-capital-value-and-social-capital-scores"
                      target="_blank"
                      style={{ color: 'inherit' }}>
                      Airstack's Cast Scores
                    </a>
                  </b>
                </>
              ) : (
                'Rewards top N casters in the channel based on configured criteria'
              )}
            </Typography>

            {type === 'REWARD_TOP_CASTERS' && (
              <>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography fontSize={13} fontWeight="bold">
                    Number of Rewards
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
                  flexDirection="column"
                  justifyContent="flex-start"
                  alignItems="stretch"
                  gap={1}>
                  <Typography fontSize={13} fontWeight="bold">
                    Reward Criteria
                  </Typography>
                  {Object.entries(rewardCriterias).map(([key, criteria]) => (
                    <Box
                      key={key}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}>
                      <Typography sx={{ width: '30%', fontSize: 13 }}>{criteria.label}</Typography>
                      <TextField
                        value={criteria.value}
                        onChange={(e) => {
                          setRewardCriterias((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], value: e.target.value }
                          }));
                        }}
                        disabled={!criteria.required && !criteria.enabled}
                        sx={{
                          width: '50%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            height: 40
                          }
                        }}
                        size="small"
                        placeholder={
                          key === 'channel'
                            ? 'Channel Name'
                            : key === 'hypersub'
                            ? 'Subscription Address'
                            : key === 'fan_token'
                            ? 'Token Name'
                            : 'Enter value'
                        }
                        slotProps={{
                          input: {
                            sx: { fontSize: 13, fontWeight: 'bold' }
                          }
                        }}
                      />

                      {!criteria.required && (
                        <Switch
                          checked={criteria.enabled}
                          onChange={(e) => {
                            setRewardCriterias((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], enabled: e.target.checked }
                            }));
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
