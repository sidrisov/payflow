import { Box, Menu, MenuItem, MenuProps, Typography } from '@mui/material';
import { FlowWalletType } from '../types/FlowType';
import { Check } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';
import { CloseCallbackType } from '../types/CloseCallbackType';
import NetworkAvatar from './NetworkAvatar';
import { green } from '@mui/material/colors';

export type ChooseWalletMenuProps = MenuProps &
  CloseCallbackType & {
    wallets: FlowWalletType[];
    selectedWallet: FlowWalletType | undefined;
    setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
  };

// TODO: fix selection issue on re-rendering
export function ChooseWalletMenu({
  wallets,
  selectedWallet,
  setSelectedWallet,
  closeStateCallback,
  ...props
}: ChooseWalletMenuProps) {
  return (
    <Menu
      {...props}
      onClose={closeStateCallback}
      sx={{ mt: 1.5, '.MuiMenu-paper': { borderRadius: 5 } }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      {wallets &&
        wallets.map((wallet) => (
          <MenuItem
            key={wallet.network}
            selected={wallet === selectedWallet}
            onClick={async () => {
              setSelectedWallet(wallet);
              closeStateCallback();
            }}>
            <Box
              width={150}
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <Box display="flex" flexDirection="row" alignItems="center">
                <NetworkAvatar tooltip network={wallet.network} sx={{ width: 24, height: 24 }} />
                <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
              </Box>
              {wallet === selectedWallet && <Check sx={{ mx: 1, color: green.A700 }} />}
            </Box>
          </MenuItem>
        ))}
    </Menu>
  );
}
