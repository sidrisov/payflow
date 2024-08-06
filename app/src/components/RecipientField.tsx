import { ExpandMore } from '@mui/icons-material';
import { Box, Button, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { SelectedIdentityType } from '../types/ProfileType';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { PayflowChip } from './chips/IdentityStatusChips';

export function RecipientField({
  recipient,
  setOpenSearchIdentity
}: {
  recipient?: SelectedIdentityType;
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
      {recipient &&
        (recipient.type === 'profile' ? (
          recipient.identity.profile && (
            <ProfileSection maxWidth={200} profile={recipient.identity.profile} />
          )
        ) : (
          <AddressSection maxWidth={200} identity={recipient.identity} />
        ))}

      {!recipient && (
        <Typography alignSelf="center" flexGrow={1}>
          Choose Recipient
        </Typography>
      )}
    </Box>
  );
}
