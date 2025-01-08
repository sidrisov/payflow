import { Box, Stack, IconButton, Typography, Button } from '@mui/material';
import { PaymentFlowSection } from './PaymentFlowSection';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { SelectedIdentityType } from '@payflow/common';
import { IoMdArrowDropdown } from 'react-icons/io';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useEffect } from 'react';
import { useMobile } from '../utils/hooks/useMobile';

export function SenderField({
  sender,
  displayFlow = true,
  setOpenSelectFlow
}: {
  sender: SelectedIdentityType;
  displayFlow?: boolean;
  setOpenSelectFlow?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { ready, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  const isMobile = useMobile();

  useEffect(() => {
    if (ready && wallets.length !== 0 && sender.type === 'address') {
      console.log('Trying to set a wallet: ', wallets);
      const wallet = wallets.find((w) => w.walletClientType !== 'privy');
      if (wallet) {
        console.debug('Setting active wallet: ', wallet);
        setActiveWallet(wallet);
      }
    }
  }, [sender, wallets, ready]);

  return (
    <Box
      display="flex"
      flexDirection="row"
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      color="inherit"
      {...(sender.type === 'address' && {
        component: Button,
        onClick: () => {
          connectWallet();
        }
      })}
      sx={{
        border: 1,
        borderRadius: 5,
        borderColor: 'divider',
        p: isMobile ? 1.5 : 1,
        textTransform: 'none'
      }}>
      {sender.identity.address &&
        (sender.type === 'profile' ? (
          sender.identity.profile && (
            <ProfileSection maxWidth={150} profile={sender.identity.profile} />
          )
        ) : (
          <AddressSection maxWidth={150} identity={sender.identity} />
        ))}

      {!sender.identity.address && (
        <Typography width="100%" fontSize={18}>
          Choose Sender
        </Typography>
      )}

      {displayFlow &&
        sender.identity.address &&
        sender.type === 'profile' &&
        sender.identity.profile?.defaultFlow && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              flexGrow: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textAlign: 'right'
            }}>
            <Box
              pl={0.5}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexGrow: 1
              }}>
              <PaymentFlowSection flow={sender.identity.profile.defaultFlow} />
            </Box>
            {setOpenSelectFlow && (
              <IconButton size="small" onClick={() => setOpenSelectFlow(true)} sx={{ p: 0.3 }}>
                <IoMdArrowDropdown />
              </IconButton>
            )}
          </Stack>
        )}
    </Box>
  );
}
