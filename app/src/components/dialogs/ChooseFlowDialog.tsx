import { Box, IconButton, MenuItem, MenuList, Stack, Tooltip, Typography } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { MoreHoriz, PlayForWork } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { green } from '@mui/material/colors';
import { FlowSettingsMenu } from '../menu/FlowSettingsMenu';
import { PaymentFlowSection } from '../PaymentFlowSection';
import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';

export type ChooseFlowMenuProps = ResponsiveDialogProps &
  CloseCallbackType & {
    configurable?: boolean;
    closeOnSelect?: boolean;
    flows: FlowType[];
    selectedFlow: FlowType;
    setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export function ChooseFlowDialog({
  configurable = true,
  closeOnSelect = true,
  flows,
  selectedFlow,
  setSelectedFlow,
  closeStateCallback,
  ...props
}: ChooseFlowMenuProps) {
  const { profile } = useContext(ProfileContext);
  const [openNewFlowDialig, setOpenNewFlowDialig] = useState<boolean>(false);
  const [openFlowSettingsMenu, setOpenFlowSettingsMenu] = useState<boolean>(false);
  const [flowAnchorEl, setFlowAnchorEl] = useState<null | HTMLElement>(null);

  // Update this function to separate flows into three categories
  const separateFlows = (flows: FlowType[]) => {
    const legacy = flows.filter(
      (flow) => flow.wallets.length > 0 && flow.wallets.some((w) => w.version === '1.3.0')
    );
    const farcaster = flows.filter((flow) => flow.type === 'FARCASTER_VERIFICATION');
    const regular = flows.filter(
      (flow) =>
        !(flow.wallets.length > 0 && flow.wallets.some((w) => w.version === '1.3.0')) &&
        flow.type !== 'FARCASTER_VERIFICATION'
    );
    return { regular, farcaster, legacy };
  };

  // Separate the flows
  const { regular, farcaster, legacy } = separateFlows(flows);

  const renderMenuItem = (flow: FlowType) => (
    <MenuItem
      key={flow.uuid}
      selected={flow.uuid === selectedFlow.uuid}
      sx={{ borderRadius: 5 }}
      onClick={async () => {
        setSelectedFlow(flow);
        if (closeOnSelect) {
          closeStateCallback();
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
            {flow.uuid === selectedFlow.uuid ? (
              <FaCheckCircle color={green.A700} size={18} />
            ) : (
              <FaRegCircle size={18} />
            )}
          </Box>
          <Box display="inherit" width={30}>
            {flow.uuid === profile?.defaultFlow?.uuid && (
              <Tooltip title="Default for receiving payments">
                <PlayForWork />
              </Tooltip>
            )}
          </Box>
          <PaymentFlowSection flow={flow} />
        </Stack>

        {configurable && flow === selectedFlow && (
          <IconButton
            size="small"
            onClick={async (event) => {
              event.stopPropagation();
              setFlowAnchorEl(event.currentTarget);
              setOpenFlowSettingsMenu(true);
            }}
            sx={{ mx: 1 }}>
            <MoreHoriz fontSize="small" />
          </IconButton>
        )}
      </Box>
    </MenuItem>
  );

  return (
    profile && (
      <>
        <ResponsiveDialog
          title="Choose payment flow"
          open={props.open}
          onOpen={() => {}}
          onClose={closeStateCallback}>
          <MenuList disablePadding sx={{ width: '100%' }}>
            <Stack
              maxHeight={300}
              mt={1}
              pr={1}
              sx={{
                overflowY: 'scroll',
                '-webkit-overflow-scrolling': 'touch'
              }}>
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                Native
              </Typography>
              {regular && regular.length > 0 ? (
                regular.map(renderMenuItem)
              ) : (
                <MenuItem disabled key="payment_flow_not_available">
                  <Typography>Not available.</Typography>
                </MenuItem>
              )}

              {/* Add Native Farcaster section */}
              {farcaster && farcaster.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    Farcaster
                  </Typography>
                  {farcaster.map(renderMenuItem)}
                </>
              )}

              {/* Legacy section */}
              {legacy && legacy.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    Legacy
                  </Typography>
                  {legacy.map(renderMenuItem)}
                </>
              )}
            </Stack>
          </MenuList>
        </ResponsiveDialog>
        {openFlowSettingsMenu && (
          <FlowSettingsMenu
            open={openFlowSettingsMenu}
            anchorEl={flowAnchorEl}
            onClose={async () => setOpenFlowSettingsMenu(false)}
            defaultFlow={selectedFlow.uuid === profile.defaultFlow?.uuid}
            flow={selectedFlow}
          />
        )}
      </>
    )
  );
}
