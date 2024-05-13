import { ExpandMore } from '@mui/icons-material';
import { Box, Button, Typography, Stack } from '@mui/material';
import { SelectedIdentityType } from '../types/ProfleType';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { PayflowChip } from './chips/IdentityStatusChips';

export function SenderField({
  sender,
  setOpenSearchIdentity
}: {
  sender?: SelectedIdentityType;
  setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <Box
      display="flex"
      flexDirection="row"
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      color="inherit"
      {...(setOpenSearchIdentity
        ? { component: Button, onClick: async () => setOpenSearchIdentity(true) }
        : {})}
      sx={{
        height: 56,
        border: 1,
        borderRadius: 5,
        p: 1.5,
        textTransform: 'none'
      }}>
      {sender &&
        (sender.type === 'profile' ? (
          sender.identity.profile && (
            <ProfileSection maxWidth={200} profile={sender.identity.profile} />
          )
        ) : (
          <AddressSection maxWidth={200} identity={sender.identity} />
        ))}

      {!sender && (
        <Typography alignSelf="center" flexGrow={1}>
          Choose Recipient
        </Typography>
      )}

      <Stack direction="row">
        {sender && sender.type === 'profile' && <PayflowChip />}
        <ExpandMore />
      </Stack>
    </Box>
  );
}
