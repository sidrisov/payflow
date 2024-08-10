import {
  AvatarGroup,
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Stack} from '@mui/material';
import { PlayForWork } from '@mui/icons-material';
import { FlowType } from '../../types/FlowType';
import { setReceivingFlow } from '../../services/flow';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { delay } from '../../utils/delay';
import { useState } from 'react';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { WalletsInfoPopover } from './WalletsInfoPopover';
import getFlowAssets from '../../utils/assets';
import { useAssetBalances } from '../../utils/queries/balances';
import { IoIosWallet } from 'react-icons/io';

export function FlowSettingsMenu({
  flow,
  defaultFlow,
  ...props
}: MenuProps & { defaultFlow: boolean; flow: FlowType }) {
  const navigate = useNavigate();

  const [openWalletDetailsPopover, setOpenWalletDetailsPopover] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const { isLoading, isFetched, data: balances } = useAssetBalances(getFlowAssets(flow));

  return (
    <>
      <Menu
        {...props}
        sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
        <MenuList dense disablePadding>
          <MenuItem
            onClick={async (event) => {
              setWalletAnchorEl(event.currentTarget);
              setOpenWalletDetailsPopover(true);
            }}>
            <ListItemIcon>
              <IoIosWallet />
            </ListItemIcon>
            <Stack width="100%" direction="row" justifyContent="space-between" alignItems="center">
              {flow.type === 'FARCASTER_VERIFICATION' ? 'Wallets' : 'Smart Wallets'}
              <AvatarGroup
                max={4}
                color="inherit"
                total={flow.wallets.length}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 30,
                  minWidth: 30,
                  '& .MuiAvatar-root': {
                    borderStyle: 'none',
                    border: 0,
                    width: 18,
                    height: 18,
                    fontSize: 10
                  }
                }}>
                {[...Array(Math.min(4, flow.wallets.length))].map((_item, i) => (
                  <NetworkAvatar
                    key={`account_card_wallet_list_${flow.wallets[i].network}`}
                    chainId={flow.wallets[i].network}
                  />
                ))}
              </AvatarGroup>
            </Stack>
          </MenuItem>
          {!defaultFlow && (
            <MenuItem
              onClick={async () => {
                if (await setReceivingFlow(flow.uuid)) {
                  toast.success('Saved! Reloading page ...', { isLoading: true });
                  await delay(1000);
                  navigate(0);
                } else {
                  toast.error('Something went wrong!');
                }
              }}>
              <ListItemIcon>
                <PlayForWork />
              </ListItemIcon>
              Make default for receiving
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      <WalletsInfoPopover
        open={openWalletDetailsPopover}
        onClose={async () => setOpenWalletDetailsPopover(false)}
        anchorEl={walletAnchorEl}
        flow={flow}
        balanceFetchResult={{ isLoading, isFetched, balances }}
      />
    </>
  );
}
