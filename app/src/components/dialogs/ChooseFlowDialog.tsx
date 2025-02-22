import {
  Box,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Tooltip,
  Typography,
  Collapse
} from '@mui/material';
import { FlowType } from '@payflow/common';
import { ExpandMore, ExpandLess, MoreVert, Add } from '@mui/icons-material';
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
  const [archivedExpanded, setArchivedExpanded] = useState<boolean>(false);
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

  // Update this function to separate flows into four categories
  const separateFlows = (flows: FlowType[]) => {
    const regular = flows.filter(
      (flow) =>
        !flow.archived &&
        flow.wallets.length > 0 &&
        !flow.wallets.some((w) => w.version === '1.3.0') &&
        flow.type !== 'FARCASTER_VERIFICATION' &&
        flow.type !== 'BANKR' &&
        flow.type !== 'RODEO'
    );
    const farcaster = flows.filter(
      (flow) => !flow.archived && flow.type === 'FARCASTER_VERIFICATION'
    );
    const bankr = !paymentView && flows.find((flow) => flow.type === 'BANKR');
    const rodeo = !paymentView && flows.find((flow) => flow.type === 'RODEO');
    const legacy = flows.filter(
      (flow) =>
        !flow.archived && flow.wallets.length > 0 && flow.wallets.some((w) => w.version === '1.3.0')
    );
    const archived = flows.filter((flow) => flow.archived);
    return { regular, farcaster, bankr, rodeo, legacy, archived };
  };

  // Separate the flows
  const { regular, farcaster, bankr, rodeo, legacy, archived } = useMemo(
    () => separateFlows(flows),
    [flows]
  );

  const hasPayflowBalance = useMemo(
    () => flows.some((flow) => flow.wallets.some((w) => w.version === '1.4.1_0.7')),
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
            if (flow.type !== 'RODEO' && flow.type !== 'BANKR') {
              localStorage.setItem('payflow:flow:selected:uuid', flow.uuid);
            }
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
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Payflow Wallets
                </Typography>
                {configurable && !hasPayflowBalance && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigate('/~/create-payflow-wallet');
                    }}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 3,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: green.A700
                      }
                    }}>
                    <Add fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {regular && regular.length > 0 ? (
                regular.map(renderMenuItem)
              ) : (
                <MenuItem disabled key="payment_flow_not_available">
                  <Typography>Not available.</Typography>
                </MenuItem>
              )}

              {farcaster && farcaster.length > 0 && (
                <>
                  <WalletSectionHeader>Farcaster Verified</WalletSectionHeader>
                  {farcaster.map(renderMenuItem)}
                </>
              )}

              {(bankr || rodeo) && (
                <>
                  <WalletSectionHeader>Read-Only Wallets</WalletSectionHeader>
                  {bankr && renderMenuItem(bankr)}
                  {rodeo && renderMenuItem(rodeo)}
                </>
              )}

              {legacy && legacy.length > 0 && (
                <>
                  <WalletSectionHeader>Legacy</WalletSectionHeader>
                  {legacy.map(renderMenuItem)}
                </>
              )}

              {archived && archived.length > 0 && (
                <>
                  <MenuItem onClick={() => setArchivedExpanded(!archivedExpanded)}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%">
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                        Archived
                      </Typography>
                      {archivedExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Stack>
                  </MenuItem>
                  <Collapse in={archivedExpanded} timeout="auto" unmountOnExit>
                    {archived.map(renderMenuItem)}
                  </Collapse>
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
