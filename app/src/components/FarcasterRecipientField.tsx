import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { FarcasterProfileSection } from './FarcasterProfileSection';
import { Social } from '../generated/graphql/types';

export function FarcasterRecipientField({
  social,
  setOpenSearchIdentity
}: {
  social: Social;
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
      <FarcasterProfileSection maxWidth={200} social={social} />

      {!social && (
        <Typography alignSelf="center" flexGrow={1}>
          Choose Farcaster Recipient
        </Typography>
      )}
    </Box>
  );
}
