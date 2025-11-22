import {
  Box,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { FlowType } from '@payflow/common';
import { MoreVert } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { green } from '@mui/material/colors';
import { WalletMenu } from '../menu/WalletMenu';
import { PaymentFlowSection } from '../PaymentFlowSection';
import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { HiOutlineDownload } from 'react-icons/hi';
import { SUPPORTED_CHAINS } from '../../utils/networks';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { IoWallet } from 'react-icons/io5';
import { useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router';

export type ChooseFlowMenuProps = ResponsiveDialogProps &
  CloseCallbackType & {
    configurable?: boolean;
    paymentView?: boolean;
    closeOnSelect?: boolean;
    flows: FlowType[];
    selectedFlow: FlowType;
    setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType>>;
  };

export function ChooseFlowDialog({
  configurable = true,
  paymentView = false,
  closeOnSelect = true,
  flows,
  selectedFlow,
  setSelectedFlow,
  closeStateCallback,
  ...props
}: ChooseFlowMenuProps) {
  const { profile } = useContext(ProfileContext);
  const { wallets } = useWallets();
  const [openFlowSettingsMenu, setOpenFlowSettingsMenu] = useState<boolean>(false);
  const [flowAnchorEl, setFlowAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLLIElement | null>(null);
  const [menuFlow, setMenuFlow] = useState<FlowType | null>(null);
  const navigate = useNavigate();

  // Load selected flow from localStorage on component mount
  useEffect(() => {
    const savedFlowUuid = localStorage.getItem('payflow:flow:selected:uuid');
    if (savedFlowUuid) {
      const savedFlow = flows.find((flow) => flow.uuid === savedFlowUuid);
      if (savedFlow) {
        setSelectedFlow(savedFlow);
      }
    }
  }, [flows]);

  // Separate flows into categories
  const separateFlows = (flows: FlowType[]) => {
    const regular = flows.filter(
      (flow) =>
        flow.wallets.length > 0 &&
        flow.type !== 'FARCASTER_VERIFICATION'
    );
    const farcaster = flows.filter(
      (flow) => flow.type === 'FARCASTER_VERIFICATION'
    );
    return { regular, farcaster };
  };

  // Separate the flows
  const { regular, farcaster } = useMemo(
    () => separateFlows(flows),
    [flows]
  );

  useEffect(() => {
    if (props.open && selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [props.open, selectedElement]);

  const renderMenuItem = useCallback(
    (flow: FlowType) => (
      <MenuItem
        key={flow.uuid}
        selected={flow.uuid === selectedFlow.uuid}
        {...(flow.uuid === selectedFlow.uuid && { ref: setSelectedElement })}
        onClick={async () => {
          if (!flow.archived) {
            setSelectedFlow(flow);
            localStorage.setItem('payflow:flow:selected:uuid', flow.uuid);
            if (closeOnSelect) {
              closeStateCallback();
            }
          }
        }}>
        <Box
          width="100%"
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between">
          <Stack direction="row" alignItems="center" justifyContent="flex-start">
            <Box display="inherit" width={30}>
              {!flow.archived &&
                (flow.uuid === selectedFlow.uuid ? (
                  <FaCheckCircle color={green.A700} size={18} />
                ) : (
                  <FaRegCircle size={18} />
                ))}
            </Box>
            <Box display="inherit" width={30}>
              {flow.uuid === profile?.defaultFlow?.uuid && (
                <Tooltip title="Preferred for receiving payments">
                  <HiOutlineDownload size={20} />
                </Tooltip>
              )}
            </Box>
            <PaymentFlowSection flow={flow} />
          </Stack>

          {configurable && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setFlowAnchorEl(event.currentTarget);
                setMenuFlow(flow);
                setOpenFlowSettingsMenu(true);
              }}
              sx={{
                pointerEvents: 'auto'
              }}>
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Box>
      </MenuItem>
    ),
    [selectedFlow.uuid, closeOnSelect, closeStateCallback]
  );

  const connectedWallets = useMemo(() => {
    return wallets
      .filter((wallet) => wallet.walletClientType !== 'privy')
      .map(
        (wallet) =>
          ({
            uuid: `connected-wallet-${wallet.address}`,
            title: shortenWalletAddressLabel2(wallet.address),
            icon: wallet.meta.icon,
            type: 'CONNECTED',
            wallets: SUPPORTED_CHAINS.map((chain) => ({
              address: wallet.address.toLowerCase(),
              network: chain.id as number
            })),
            signer: wallet.address
          }) as FlowType
      );
  }, [wallets]);

  const renderConnectedWalletItems = useCallback(() => {
    if (!connectedWallets.length) {
      return (
        <LoadingConnectWalletButton
          size="medium"
          variant="outlined"
          title="Connect Wallet"
          startIcon={<IoWallet />}
        />
      );
    }

    return (
      <>
        <Typography variant="subtitle2" sx={{ px: 2, pt: 1, pb: 0, color: 'text.secondary' }}>
          Connected Wallets
        </Typography>
        {connectedWallets.map((wallet) => renderMenuItem(wallet))}
      </>
    );
  }, [connectedWallets, renderMenuItem]);

  const WalletSectionHeader = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="subtitle2" sx={{ px: 2, pt: 1, pb: 0, color: 'text.secondary' }}>
      {children}
    </Typography>
  );

  return (
    profile && (
      <>
        <ResponsiveDialog
          title="Choose Payment Wallet"
          open={props.open}
          onClose={closeStateCallback}>
          <MenuList disablePadding sx={{ width: '100%' }}>
            <Stack
              maxHeight={300}
              mt={1}
              pr={1}
              sx={{
                overflowY: 'scroll',
                scrollbarWidth: 'thin'
              }}>
              {renderConnectedWalletItems()}


              {farcaster && farcaster.length > 0 && (
                <>
                  <WalletSectionHeader>Farcaster Verified</WalletSectionHeader>
                  {farcaster.map(renderMenuItem)}
                </>
              )}






            </Stack>
          </MenuList>
        </ResponsiveDialog>

        {menuFlow && (
          <WalletMenu
            open={openFlowSettingsMenu}
            anchorEl={flowAnchorEl}
            onClose={() => {
              setOpenFlowSettingsMenu(false);
            }}
            showOnlySigner={paymentView}
            defaultFlow={menuFlow.uuid === profile.defaultFlow?.uuid}
            flow={menuFlow}
          />
        )}
      </>
    )
  );
}
