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
import { FlowType } from '../../types/FlowType';
import { PlayForWork, ExpandMore, ExpandLess, MoreVert } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useEffect, useState } from 'react';
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
  const [openFlowSettingsMenu, setOpenFlowSettingsMenu] = useState<boolean>(false);
  const [flowAnchorEl, setFlowAnchorEl] = useState<null | HTMLElement>(null);
  const [archivedExpanded, setArchivedExpanded] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<HTMLLIElement | null>(null);
  const [menuFlow, setMenuFlow] = useState<FlowType | null>(null);

  // Update this function to separate flows into four categories
  const separateFlows = (flows: FlowType[]) => {
    const regular = flows.filter(
      (flow) =>
        !flow.archived &&
        flow.wallets.length > 0 &&
        !flow.wallets.some((w) => w.version === '1.3.0') &&
        flow.type !== 'FARCASTER_VERIFICATION'
    );
    const farcaster = flows.filter(
      (flow) => !flow.archived && flow.type === 'FARCASTER_VERIFICATION'
    );
    const legacy = flows.filter(
      (flow) =>
        !flow.archived && flow.wallets.length > 0 && flow.wallets.some((w) => w.version === '1.3.0')
    );
    const archived = flows.filter((flow) => flow.archived);
    return { regular, farcaster, legacy, archived };
  };

  // Separate the flows
  const { regular, farcaster, legacy, archived } = separateFlows(flows);

  useEffect(() => {
    if (props.open && selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [props.open, selectedElement]);

  const renderMenuItem = (flow: FlowType) => (
    <MenuItem
      key={flow.uuid}
      selected={flow.uuid === selectedFlow.uuid}
      {...(flow.uuid === selectedFlow.uuid && { ref: setSelectedElement })}
      sx={{
        borderRadius: 5
      }}
      onClick={async () => {
        if (!flow.archived) {
          setSelectedFlow(flow);
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
              <Tooltip title="Default for receiving payments">
                <PlayForWork />
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
              pointerEvents: 'auto' // This ensures the button is always clickable
            }}>
            <MoreVert fontSize="small" />
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

              {farcaster && farcaster.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    Farcaster
                  </Typography>
                  {farcaster.map(renderMenuItem)}
                </>
              )}

              {legacy && legacy.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    Legacy
                  </Typography>
                  {legacy.map(renderMenuItem)}
                </>
              )}

              {archived && archived.length > 0 && (
                <>
                  <MenuItem
                    onClick={() => setArchivedExpanded(!archivedExpanded)}
                    sx={{ borderRadius: 5 }}>
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
        {openFlowSettingsMenu && menuFlow && (
          <FlowSettingsMenu
            open={openFlowSettingsMenu}
            anchorEl={flowAnchorEl}
            onClose={async () => {
              setOpenFlowSettingsMenu(false);
              setMenuFlow(null);
            }}
            defaultFlow={menuFlow.uuid === profile.defaultFlow?.uuid}
            flow={menuFlow}
          />
        )}
      </>
    )
  );
}
