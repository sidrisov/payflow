import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { FarcasterProfileSection } from './FarcasterProfileSection';

export function FarcasterRecipientField({
  fid,
  setOpenSearchIdentity
}: {
  fid?: number;
  setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      display="flex"
      flexDirection="row"
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      color="inherit"
      {...(setOpenSearchIdentity && {
        component: Button,
        onClick: async () => setOpenSearchIdentity(true)
      })}
      sx={{
        border: 1,
        borderRadius: 5,
        borderColor: 'divider',
        p: isMobile ? 1.5 : 1,
        textTransform: 'none'
      }}>
      {fid && <FarcasterProfileSection maxWidth={200} fid={fid} />}

      {!fid && (
        <Typography alignSelf="center" flexGrow={1}>
          Choose Farcaster Recipient
        </Typography>
      )}
    </Box>
  );
}
