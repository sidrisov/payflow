import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import { SelectedIdentityType } from '../types/ProfileType';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useEffect } from 'react';
import { PaymentFlowSection } from './PaymentFlowSection';
import { IoMdArrowDropdown } from 'react-icons/io';

export function SenderField({
  sender,
  setOpenSelectFlow,
  displayFlow = true
}: { sender: SelectedIdentityType } & {
  setOpenSelectFlow?: React.Dispatch<React.SetStateAction<boolean>>;
} & { displayFlow?: boolean }) {
  const { ready, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        onClick: async () => {
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
            <ProfileSection maxWidth={200} profile={sender.identity.profile} />
          )
        ) : (
          <AddressSection maxWidth={200} identity={sender.identity} />
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
          <Stack ml={0.5} direction="row" spacing={0.5} alignItems="center">
            <PaymentFlowSection flow={sender.identity.profile?.defaultFlow} />
            {setOpenSelectFlow && (
              <Tooltip title="Payment Flows">
                <IconButton
                  size="small"
                  onClick={async () => {
                    setOpenSelectFlow(true);
                  }}
                  sx={{ p: 0.3 }}>
                  <IoMdArrowDropdown />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
    </Box>
  );
}
