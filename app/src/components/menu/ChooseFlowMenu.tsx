import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { Add, Check, MoreHoriz, PlayForWork } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { green } from '@mui/material/colors';
import { FlowSettingsMenu } from './FlowSettingsMenu';
import { PaymentFlowSection } from '../PaymentFlowSection';
import ResponsiveDialog, { ResponsiveDialogProps } from '../dialogs/ResponsiveDialog';

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

  return (
    profile && (
      <>
        <ResponsiveDialog
          title="Choose payment flow"
          open={props.open}
          onOpen={() => {}}
          onClose={closeStateCallback}>
          <MenuList sx={{ width: '100%' }}>
            <Divider variant="middle" />
            <Stack
              maxHeight={300}
              mt={1}
              pr={1}
              sx={{
                overflowY: 'scroll',
                '-webkit-overflow-scrolling': 'touch'
              }}>
              {flows && flows.length > 0 ? (
                flows.map((flow) => (
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
                          {flow.uuid === selectedFlow.uuid && <Check sx={{ color: green.A700 }} />}
                        </Box>
                        <Box display="inherit" width={30}>
                          {flow.uuid === profile.defaultFlow?.uuid && (
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
                ))
              ) : (
                <MenuItem disabled key="payment_flow_not_available">
                  <Typography>Not available.</Typography>
                </MenuItem>
              )}
            </Stack>
            {configurable && (
              <>
                <Divider variant="middle" />
                <MenuItem
                  disabled
                  key="add_payment_flow"
                  onClick={async () => {
                    setOpenNewFlowDialig(true);
                  }}
                  sx={{ justifyContent: 'center' }}>
                  <Add fontSize="small" sx={{ width: 30, color: green.A700 }} />
                  <Typography variant="subtitle2" color={green.A700}>
                    New Payment Flow
                  </Typography>
                </MenuItem>
              </>
            )}
          </MenuList>
        </ResponsiveDialog>
        {/* {openNewFlowDialig && (
          <NewFlowDialog
            profile={profile}
            open={openNewFlowDialig}
            closeStateCallback={async () => {
              setOpenNewFlowDialig(false);
            }}
          />
        )} */}
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
