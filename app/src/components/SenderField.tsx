import { Box, Button, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { SelectedIdentityType } from '../types/ProfleType';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { PayflowChip } from './chips/IdentityStatusChips';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function SenderField({ sender }: { sender: SelectedIdentityType }) {
  const { connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

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
      {...(sender.type === 'address' && {
        component: Button,
        onClick: async () => {
          connectWallet();
          // filter out embedded wallets
          const wallet = wallets.filter((w) => w.walletClientType !== 'privy')[0];
          if (wallet) {
            console.debug('Setting active wallet: ', wallet);
            setActiveWallet(wallet);
          }
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
        <Typography alignSelf="center" flexGrow={1}>
          <b>Choose Sender</b>
        </Typography>
      )}

      {sender.identity.address && sender.type === 'profile' && (
        <Stack alignItems="flex-end">
          <PayflowChip />
          <Typography variant="caption" maxWidth={150} noWrap>
            {sender.identity.profile?.defaultFlow?.title}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
