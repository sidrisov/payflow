import { Avatar, Box, Menu, MenuItem, MenuProps, Tooltip, Typography } from '@mui/material';
import { FlowWalletType } from '../types/FlowType';
import { Check } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';
import { CloseCallbackType } from '../types/CloseCallbackType';
import getNetworkImageSrc from '../utils/networkImages';

export function ChooseWalletMenu(
  props: MenuProps &
    CloseCallbackType & {
      wallets: FlowWalletType[];
      selectedWallet: FlowWalletType;
      setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType>>;
    }
) {
  const { wallets, selectedWallet, setSelectedWallet, closeStateCallback } = props;
  return (
    <Menu
      {...props}
      onClose={closeStateCallback}
      sx={{ mt: 1.5 }}
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
                <Tooltip title={wallet.network}>
                  <Avatar src={getNetworkImageSrc(wallet.network)} sx={{ width: 24, height: 24 }} />
                </Tooltip>
                <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
              </Box>
              {wallet === selectedWallet && <Check color="success" sx={{ ml: 1 }} />}
            </Box>
          </MenuItem>
        ))}
    </Menu>
  );
}
