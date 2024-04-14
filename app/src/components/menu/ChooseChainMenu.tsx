import { Box, Menu, MenuItem, MenuProps, Typography } from '@mui/material';
import { Check } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { green } from '@mui/material/colors';
import { Chain } from 'viem';

export type ChooseChainMenuProps = MenuProps &
  CloseCallbackType & {
    chains: Chain[];
    selectedChain: Chain;
    setSelectedChain: React.Dispatch<React.SetStateAction<Chain>>;
  };

export function ChooseChainMenu({
  chains,
  selectedChain,
  setSelectedChain,
  closeStateCallback,
  ...props
}: ChooseChainMenuProps) {
  return (
    <Menu
      {...props}
      onClose={closeStateCallback}
      sx={{ mt: 1.5, '.MuiMenu-paper': { borderRadius: 5, minWidth: 180 } }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      {chains.map((chain) => (
        <MenuItem
          key={chain.name}
          selected={chain.id === selectedChain.id}
          onClick={async () => {
            setSelectedChain(chain);
            closeStateCallback();
          }}>
          <Box
            width={160}
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Box display="flex" flexDirection="row" alignItems="center">
              <NetworkAvatar tooltip chainId={chain.id} sx={{ width: 24, height: 24 }} />
              <Typography ml={1}>{chain.name}</Typography>
            </Box>
            {chain.id === selectedChain.id && <Check sx={{ color: green.A700 }} />}
          </Box>
        </MenuItem>
      ))}
    </Menu>
  );
}
