import {
  AutoAwesome,
  ExpandLess,
  ExpandMore} from '@mui/icons-material';
import { Stack, Box, Chip, Typography, IconButton, NativeSelect } from '@mui/material';
import { useState } from 'react';
import { type } from '../types/PaymentType';
import { grey } from '@mui/material/colors';

export function PaymentCastActionAdvancedSection({
  type,
  setType
}: {
  type: type;
  setType: React.Dispatch<React.SetStateAction<type>>;
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
                  setType(event.target.value as type);
                }}
                inputMode="text"
                sx={{ fontSize: 13, fontWeight: 'bold' }}>
                <option value="INTENT">Regular</option>
                <option value="INTENT_TOP_REPLY">
                  <Typography>Top Replier</Typography>
                </option>
              </NativeSelect>
            </Box>
            <Typography
              variant="caption"
              fontWeight="bold"
              maxWidth={300}
              textAlign="center"
              sx={{ p: 2, borderColor: 'divider', color: grey[400] }}>
              {type === 'INTENT'
                ? 'Payment intent will be submitted for the owner of applied cast'
                : 'Payment intent will be submitted for the top replier of the applied cast, based on their Social Capital Value (Airstack)."'}
            </Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}
