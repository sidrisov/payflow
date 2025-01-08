import { Box, Button, Typography } from '@mui/material';
import { SelectedIdentityType } from '@payflow/common';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { useMobile } from '../utils/hooks/useMobile';
import { Address } from 'viem';

export function RecipientField({
  recipient,
  recipientAddress,
  setOpenSearchIdentity
}: {
  recipient?: SelectedIdentityType;
  recipientAddress?: Address;
  setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isMobile = useMobile();

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      color="inherit"
      {...(setOpenSearchIdentity && {
        component: Button,
        onClick: () => setOpenSearchIdentity(true)
      })}
      sx={{
        borderRadius: 5,
        borderColor: 'divider',
        p: isMobile ? 1.5 : 1,
        textTransform: 'none'
      }}>
      {recipient &&
        (recipient.type === 'profile' ? (
          recipient.identity.profile && (
            <ProfileSection
              maxWidth={200}
              profile={recipient.identity.profile}
              address={recipientAddress}
              view="flow"
            />
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
