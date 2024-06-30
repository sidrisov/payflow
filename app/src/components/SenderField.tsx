import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { SelectedIdentityType } from '../types/ProfleType';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useEffect } from 'react';

export function SenderField({ sender }: { sender: SelectedIdentityType }) {
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

      {sender.identity.address && sender.type === 'profile' && (
        <Typography mr={1} variant="caption" fontWeight="bold" maxWidth={150} noWrap>
          {sender.identity.profile?.defaultFlow?.title}
        </Typography>
      )}
    </Box>
  );
}
