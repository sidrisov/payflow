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
import { MdEdit } from 'react-icons/md';

import { FlowType } from '@payflow/common';
import { setReceivingFlow } from '../../services/flow';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { delay } from '../../utils/delay';
import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { WalletBalanceDialog } from './WalletInfoDialog';
import getFlowAssets from '../../utils/assets';
import { useAssetBalances } from '../../utils/queries/balances';
import { IoMdKey } from 'react-icons/io';
import { socialLink, ZAPPER } from '../../utils/dapps';
import { ProfileContext } from '../../contexts/UserContext';
import { useWallets } from '@privy-io/react-auth';
import { usePrivy } from '@privy-io/react-auth';
import { isSupportedChain } from '../../utils/networks';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { HiOutlineDownload, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { isBrowser } from 'react-device-detect';
import { formatAmountWithSuffix } from '../../utils/formats';
import { IoWallet } from 'react-icons/io5';
import { EditFlowDialog } from '../dialogs/EditFlowDialog';

type DialogType = 'none' | 'balanceInfo' | 'edit';

export function WalletMenu({
  showOnlySigner,
  flow,
  defaultFlow,
  ...props
}: MenuProps & { showOnlySigner: boolean; defaultFlow: boolean; flow: FlowType }) {
  const navigate = useNavigate();

  const { profile, isFrameV2 } = useContext(ProfileContext);

  const { isLoading, isFetched, data: balances } = useAssetBalances(getFlowAssets(flow));

  const { wallets } = useWallets();
  const { login, logout, authenticated, ready, connectWallet, linkPasskey } = usePrivy();
  const { setActiveWallet } = useSetActiveWallet();

  const menuRef = useRef<HTMLDivElement>(null);

  const [activeDialog, setActiveDialog] = useState<DialogType>('none');

  const formattedTotalBalance = useMemo(() => {
    if (isFetched && balances && balances.length > 0) {
      const total = balances
        .filter((balance) => balance.balance)
        .reduce((sum, current) => sum + current.usdValue, 0)
        .toFixed(1);
      return formatAmountWithSuffix(total);
    }
    return '0.00';
  }, [isFetched, balances]);

  const walletAddress = useMemo(() => {
    return flow.wallets[0].address;
  }, [flow.wallets]);

  useEffect(() => {
    if (ready && wallets.length !== 0) {
      const wallet =
        flow.type !== 'CONNECTED'
          ? wallets.find((w) => w.address.toLowerCase() === flow.signer.toLowerCase())
          : wallets.find((w) => w.walletClientType !== 'privy');
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
          ``;
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
        connectWallet({
          ...(flow.type !== 'CONNECTED' && { suggestedAddress: flow.signer })
        });
        props.onClose?.({}, 'backdropClick');
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

  // Helper to open a new dialog and close the menu
  const openDialog = (dialog: DialogType) => {
    props.onClose?.({}, 'backdropClick');
    setActiveDialog(dialog);
  };

  return (
    <>
      <Menu
        ref={menuRef}
        sx={{
          mt: 1,
          zIndex: 1500,
          '&:focus': { outline: 'none' },
          '& .MuiList-root': {
            p: 0
          },
          '& .MuiMenuItem-root': {
            borderRadius: 0
          }
        }}
        disableEnforceFocus={true}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        {...props}>
        <MenuList dense disablePadding>
          {flow.type !== 'BANKR' && flow.type !== 'RODEO' && (
            <>
              <MenuItem onClick={handleConnectWallet}>
                <ListItemIcon>
                  {flow.type === 'CONNECTED' ? <HiOutlineSwitchHorizontal /> : <AiFillSignature />}
                </ListItemIcon>
                <Stack>
                  <Typography>
                    {flow.type === 'CONNECTED'
                      ? 'Switch Wallet'
                      : isConnected
                      ? `Re-connect ${flow.signerProvider === 'privy' ? 'Signer' : 'Wallet'}`
                      : `Connect ${flow.signerProvider === 'privy' ? 'Signer' : 'Wallet'}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getSignerInfo()}
                  </Typography>
                </Stack>
              </MenuItem>

              {(!isFrameV2 || isBrowser) && flow.signerProvider === 'privy' && isConnected && (
                <MenuItem
                  onClick={() => {
                    linkPasskey();
                    props.onClose?.({}, 'backdropClick');
                  }}>
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
          <MenuItem onClick={() => openDialog('balanceInfo')}>
            <ListItemIcon>
              <IoWallet />
            </ListItemIcon>
            <Stack width="100%" direction="row" justifyContent="space-between" alignItems="center">
              <Typography>{shortenWalletAddressLabel2(walletAddress)}</Typography>
              <AvatarGroup
                max={4}
                color="inherit"
                total={flow.wallets.filter((w) => w.network && isSupportedChain(w.network)).length}
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
                {flow.wallets
                  .filter((w) => w.network && isSupportedChain(w.network))
                  .slice(0, 4)
                  .map((wallet) => (
                    <NetworkAvatar
                      key={`account_card_wallet_list_${wallet.network}`}
                      chainId={wallet.network}
                    />
                  ))}
              </AvatarGroup>
            </Stack>
          </MenuItem>
          {!showOnlySigner && (
            <>
              {flow.type !== 'BANKR' && flow.type !== 'RODEO' && (
                <>
                  {flow.type !== 'CONNECTED' && !defaultFlow && !flow.archived && (
                    <MenuItem
                      onClick={async () => {
                        if (await setReceivingFlow(flow.uuid)) {
                          toast.success('Saved! Refreshing', { isLoading: true });
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
              {!showOnlySigner && (!flow.type || flow.type === 'REGULAR') && !flow.archived && (
                <>
                  <Divider />
                  <MenuItem onClick={() => openDialog('edit')}>
                    <ListItemIcon>
                      <MdEdit />
                    </ListItemIcon>
                    <Stack>
                      <Typography>Edit</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Rename, archive, etc.
                      </Typography>
                    </Stack>
                  </MenuItem>
                </>
              )}
            </>
          )}
        </MenuList>
      </Menu>

      <WalletBalanceDialog
        open={activeDialog === 'balanceInfo'}
        onClose={() => setActiveDialog('none')}
        flow={flow}
        balanceFetchResult={{ isLoading, isFetched, balances }}
      />

      <EditFlowDialog
        open={activeDialog === 'edit'}
        onClose={() => setActiveDialog('none')}
        flow={flow}
        totalBalance={formattedTotalBalance}
      />
    </>
  );
}
