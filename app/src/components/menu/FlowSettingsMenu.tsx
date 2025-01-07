import {
  Menu,
  MenuItem,
  MenuList,
  ListItemIcon,
  Divider,
  Stack,
  Avatar,
  AvatarGroup,
  MenuProps,
  Typography
} from '@mui/material';
import { AiFillSignature } from 'react-icons/ai';

import { FlowType } from '../../types/FlowType';
import { setReceivingFlow } from '../../services/flow';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { delay } from '../../utils/delay';
import { useContext, useState, useEffect, useRef } from 'react';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { WalletsInfoPopover } from './WalletsInfoPopover';
import getFlowAssets from '../../utils/assets';
import { useAssetBalances } from '../../utils/queries/balances';
import { IoIosWallet, IoMdSquare, IoMdKey } from 'react-icons/io';
import { socialLink, ZAPPER } from '../../utils/dapps';
import { ProfileContext } from '../../contexts/UserContext';
import { useWallets } from '@privy-io/react-auth';
import { usePrivy } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { HiOutlineDownload } from 'react-icons/hi';
import { PayMeDialog } from '../dialogs/PayMeDialog';
import { AutoMode } from '@mui/icons-material';
import { WalletPermissionsDialog } from '../dialogs/WalletPermissionsDialog';

export function FlowSettingsMenu({
  showOnlySigner,
  flow,
  defaultFlow,
  ...props
}: MenuProps & { showOnlySigner: boolean; defaultFlow: boolean; flow: FlowType }) {
  const navigate = useNavigate();

  const [openWalletDetailsPopover, setOpenWalletDetailsPopover] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);
  const { profile } = useContext(ProfileContext);

  const { isLoading, isFetched, data: balances } = useAssetBalances(getFlowAssets(flow));

  const { wallets } = useWallets();
  const { login, logout, authenticated, ready, connectWallet, linkPasskey } = usePrivy();
  const { setActiveWallet } = useSetActiveWallet();

  const menuRef = useRef<HTMLDivElement>(null);

  const [openPayMeDialog, setOpenPayMeDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);

  useEffect(() => {
    if (ready && wallets.length !== 0) {
      const wallet = wallets.find((w) => w.address.toLowerCase() === flow.signer.toLowerCase());
      if (wallet) {
        setActiveWallet(wallet);
      }
    }
  }, [flow, wallets, ready, setActiveWallet]);

  useEffect(() => {
    if (props.open && menuRef.current) {
      menuRef.current.setAttribute('tabIndex', '-1');
      menuRef.current.style.outline = 'none';
    }
  }, [props.open]);

  const handleConnectWallet = async () => {
    if (flow.signerProvider === 'privy') {
      if (!authenticated) {
        setTimeout(() => {
          login({
            ...(flow.signerCredential && {
              prefill: { type: 'email', value: flow.signerCredential },
              defaultPrevented: true
            })
          });
        }, 100); // 100ms delay
      } else {
        const embeddedWallet = wallets.find(
          (w) =>
            w.walletClientType === 'privy' && w.address.toLowerCase() === flow.signer.toLowerCase()
        );
        if (embeddedWallet) {
          await logout();
        }
        setTimeout(() => {
          login({
            ...(flow.signerCredential && {
              prefill: { type: 'email', value: flow.signerCredential }
            })
          });
        }, 100);
      }
    } else {
      setTimeout(() => {
        connectWallet({ suggestedAddress: flow.signer });
      }, 100);
    }
  };

  const isConnected = wallets.some(
    (wallet) => wallet.address.toLowerCase() === flow.signer.toLowerCase()
  );

  const getSignerInfo = () => {
    if (flow.signerProvider === 'privy' && flow.signerCredential) {
      return flow.signerCredential;
    } else {
      return shortenWalletAddressLabel2(flow.signer);
    }
  };

  return (
    <>
      <Menu
        {...props}
        ref={menuRef}
        sx={{
          mt: 1,
          '.MuiMenu-paper': {
            borderRadius: 5
          },
          zIndex: 1500,
          '&:focus': { outline: 'none' }
        }}
        disableEnforceFocus={true}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
        <MenuList dense disablePadding>
          {flow.type !== 'BANKR' && flow.type !== 'RODEO' && (
            <>
              <MenuItem onClick={handleConnectWallet}>
                <ListItemIcon>
                  <AiFillSignature />
                </ListItemIcon>
                <Stack>
                  <Typography>{isConnected ? 'Re-connect Signer' : 'Connect Signer'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getSignerInfo()}
                  </Typography>
                </Stack>
              </MenuItem>
              {isConnected && flow.signerProvider === 'privy' && (
                <MenuItem onClick={() => linkPasskey()}>
                  <ListItemIcon>
                    <IoMdKey />
                  </ListItemIcon>
                  <Stack>
                    <Typography>Manage Passkeys</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Secure flow with passkeys
                    </Typography>
                  </Stack>
                </MenuItem>
              )}
              {!showOnlySigner && <Divider />}
            </>
          )}
          {!showOnlySigner && (
            <>
              {flow.type !== 'BANKR' && flow.type !== 'RODEO' && (
                <>
                  {(flow.type === 'FARCASTER_VERIFICATION' || defaultFlow) && (
                    <MenuItem onClick={() => setOpenPayMeDialog(true)}>
                      <ListItemIcon>
                        <IoMdSquare />
                      </ListItemIcon>
                      <Stack>
                        <Typography>Pay Me</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          Copy & embed frame in socials
                        </Typography>
                      </Stack>
                    </MenuItem>
                  )}
                  {!defaultFlow && !flow.archived && (
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
                        <HiOutlineDownload size={20} />
                      </ListItemIcon>
                      <Typography>Make default for receiving</Typography>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={async (event) => {
                      setWalletAnchorEl(event.currentTarget);
                      setOpenWalletDetailsPopover(true);
                    }}>
                    <ListItemIcon>
                      <IoIosWallet />
                    </ListItemIcon>
                    <Stack
                      width="100%"
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center">
                      <Typography>
                        {flow.type === 'FARCASTER_VERIFICATION' ? 'Wallets' : 'Smart Wallets'}
                      </Typography>
                      <AvatarGroup
                        max={4}
                        color="inherit"
                        total={flow.wallets.length}
                        sx={{
                          ml: 1,
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
                  {flow.wallets[0].version?.endsWith('_0.7') && (
                    <MenuItem
                      disabled={!profile?.earlyFeatureAccess}
                      onClick={() => setOpenPermissionsDialog(true)}>
                      <ListItemIcon>
                        <AutoMode sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <Stack>
                        <Typography>Permissions</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          Spending limits & access
                        </Typography>
                      </Stack>
                    </MenuItem>
                  )}
                  <Divider />
                </>
              )}
              <MenuItem
                component="a"
                href={socialLink(ZAPPER, flow.wallets[0].address)}
                target="_blank">
                <ListItemIcon>
                  <Avatar src="/dapps/zapper.png" sx={{ width: 20, height: 20 }} />
                </ListItemIcon>
                <Typography>More on Zapper</Typography>
              </MenuItem>
            </>
          )}
        </MenuList>
      </Menu>

      <PayMeDialog
        open={openPayMeDialog}
        onClose={() => setOpenPayMeDialog(false)}
        flow={flow}
        profile={profile}
      />

      <WalletsInfoPopover
        open={openWalletDetailsPopover}
        onClose={async () => setOpenWalletDetailsPopover(false)}
        anchorEl={walletAnchorEl}
        flow={flow}
        balanceFetchResult={{ isLoading, isFetched, balances }}
      />

      <WalletPermissionsDialog
        open={openPermissionsDialog}
        onClose={() => setOpenPermissionsDialog(false)}
        flow={flow}
      />
    </>
  );
}
