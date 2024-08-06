import { Box, Stack } from '@mui/material';
import { IdentityType } from '../types/ProfileType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { PayflowChip, InvitedChip } from './chips/IdentityStatusChips';
import { SocialPresenceStack } from './SocialPresenceStack';

export function FarcasterIdentitySelectOption({ identity }: { identity: IdentityType }) {
  const type = identity.profile ? 'profile' : 'address';

  return (
    (type === 'profile' ? identity.profile : identity.meta) && (
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        height={60}>
        <Box
          justifyContent="flex-start"
          width={150}
          color="inherit"
          textTransform="none"
          sx={{ borderRadius: 5 }}>
          {type === 'profile' && identity.profile && (
            <ProfileSection maxWidth={200} profile={identity.profile} />
          )}

          {type === 'address' && identity.meta && (
            <AddressSection maxWidth={200} identity={identity} copy={false} />
          )}
        </Box>

        <Stack direction="column" spacing={0.5} alignItems="center" sx={{ width: 100 }}>
          {type === 'profile' ? <PayflowChip /> : identity.invited && <InvitedChip />}

          {identity.meta && (
            <SocialPresenceStack
              key={`social_presence_stack_${identity.address}`}
              meta={identity.meta}
            />
          )}
        </Stack>
      </Box>
    )
  );
}
