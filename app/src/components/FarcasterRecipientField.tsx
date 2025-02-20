import { Box, Button, Typography } from '@mui/material';
import { FarcasterProfileSection } from './FarcasterProfileSection';
import { Social } from '../generated/graphql/types';
import { useMobile } from '../utils/hooks/useMobile';

export function FarcasterRecipientField({
  social,
  setOpenSearchIdentity,
  variant = 'outlined'
}: {
  variant?: 'outlined' | 'text';
  social: Social;
  setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isMobile = useMobile();

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Recipient:
      </Typography>
      <Box
        display="flex"
        flexDirection="row"
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        color="inherit"
        {...(setOpenSearchIdentity && {
          component: Button,
          onClick: () => setOpenSearchIdentity(true)
        })}
        sx={{
          ...(variant === 'outlined' && {
            border: 1,
            borderRadius: 5,
            borderColor: 'divider',
            p: isMobile ? 1.5 : 1
          }),
          textTransform: 'none'
        }}>
        <FarcasterProfileSection maxWidth={200} social={social} />

        {!social && (
          <Typography alignSelf="center" flexGrow={1}>
            Choose Farcaster Recipient
          </Typography>
        )}
      </Box>
    </Box>
  );
}
