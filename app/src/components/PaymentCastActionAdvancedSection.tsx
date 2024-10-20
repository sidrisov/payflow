import { AutoAwesome, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Stack, Box, Chip, Typography, IconButton, NativeSelect } from '@mui/material';
import { useState } from 'react';
import { Type } from '../types/PaymentType';
import { grey } from '@mui/material/colors';

export function PaymentCastActionAdvancedSection({
  type,
  setType
}: {
  type: Type;
  setType: React.Dispatch<React.SetStateAction<Type>>;
}) {
  const [expand, setExpand] = useState<boolean>(false);

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
                Payment Type
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
                <option value="INTENT">Regular</option>
                <option value="INTENT_TOP_REPLY">
                  <Typography>Top Comment</Typography>
                </option>
                <option value="INTENT_TOP_CASTERS">
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
              {type === 'INTENT' ? (
                'Rewards selected cast author'
              ) : type === 'INTENT_TOP_REPLY' ? (
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
          </Box>
        </>
      )}
    </Stack>
  );
}
