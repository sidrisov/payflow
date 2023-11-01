import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  MenuProps,
  Tooltip,
  Typography
} from '@mui/material';
import { FlowWalletType } from '../types/FlowType';
import { Check } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';

export function ChooseWalletMenu(
  props: MenuProps & {
    wallets: FlowWalletType[];
    selectedWallet: FlowWalletType;
    setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType>>;
  }
) {
  const { wallets, selectedWallet, setSelectedWallet } = props;
  return (
    <Menu
      {...props}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      {wallets &&
        wallets.map((wallet) => (
          <MenuItem
            key={wallet.network}
            selected={wallet === selectedWallet}
            onClick={() => setSelectedWallet(wallet)}>
            <Box
              width={150}
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <Box display="flex" flexDirection="row" alignItems="center">
                <Tooltip title={wallet.network}>
                  <Avatar
                    src={'/networks/' + wallet.network + '.png'}
                    sx={{ width: 24, height: 24 }}
                  />
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
