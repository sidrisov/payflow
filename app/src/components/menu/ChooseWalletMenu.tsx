import {
  Box,
  Divider,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Stack,
  Typography
} from '@mui/material';
import { FlowWalletType } from '../../types/FlowType';
import { Check } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { green } from '@mui/material/colors';
import { getNetworkDisplayName } from '../../utils/networks';

export type ChooseWalletMenuProps = MenuProps &
  CloseCallbackType & {
    wallets: FlowWalletType[];
    selectedWallet: FlowWalletType | undefined;
    setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
  };

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
      sx={{ mt: 1.5, '.MuiMenu-paper': { borderRadius: 5, minWidth: 180 }, zIndex: 1550 }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      <MenuList dense disablePadding>
        <MenuItem disabled key="choose_wallet_menu_title" sx={{ justifyContent: 'center' }}>
          <Typography fontWeight="bold" fontSize={15}>
            Choose Network
          </Typography>
        </MenuItem>
        <Divider variant="middle" />
        <Stack mt={1}>
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
                  width={160}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between">
                  <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={1}>
                    <NetworkAvatar
                      tooltip
                      chainId={wallet.network}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography>{getNetworkDisplayName(wallet.network)}</Typography>
                  </Stack>
                  {wallet === selectedWallet && <Check sx={{ color: green.A700 }} />}
                </Box>
              </MenuItem>
            ))}
        </Stack>
      </MenuList>
    </Menu>
  );
}
