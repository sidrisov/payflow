import { Avatar, Badge, Box, Chip, Stack, Typography } from '@mui/material';
import { green, grey } from '@mui/material/colors';
import { useDarkMode } from '../utils/hooks/useDarkMode';
import { useMobile } from '../utils/hooks/useMobile';

export function PublicSearchPay({
  setOpenSearchIdentity
}: {
  setOpenSearchIdentity: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isMobile = useMobile();
  const prefersDarkMode = useDarkMode();

  return (
    <Box
      position="absolute"
      display="flex"
      flexDirection="column"
      alignItems="center"
      boxSizing="border-box"
      justifyContent="center"
      sx={{ inset: 0 }}>
      <Stack spacing={1} alignItems="center" sx={{ border: 0 }}>
        <Badge
          badgeContent={
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              fontWeight="900"
              color={green.A700}
              sx={{ mb: 3, ml: isMobile ? -20 : -10 }}>
              made easy
            </Typography>
          }>
          <Typography
            maxWidth={375}
            variant={isMobile ? 'h4' : 'h3'}
            fontWeight="500"
            textAlign="center">
            Onchain Social Payments
          </Typography>
        </Badge>

        <Typography
          variant="h6"
          fontSize={isMobile ? 16 : 20}
          fontWeight="900"
          color={green.A700}
          textAlign="center">
          abstracted | gasless | non-custodial
        </Typography>

        <Typography variant="caption" fontSize={isMobile ? 14 : 16} color="grey" textAlign="center">
          farcaster | lens | ens supported
        </Typography>

        <Chip
          size="medium"
          clickable
          icon={<Avatar src="/payflow.png" sx={{ width: 32, height: 32 }} />}
          variant="outlined"
          label="search & pay"
          onClick={() => {
            setOpenSearchIdentity(true);
          }}
          sx={{
            border: 2,
            backgroundColor: prefersDarkMode ? grey[800] : grey[50],
            borderStyle: 'dotted',
            borderColor: 'divider',
            borderRadius: 10,
            width: 220,
            '& .MuiChip-label': { fontSize: 20 },
            height: 50
          }}
        />
      </Stack>
    </Box>
  );
}
