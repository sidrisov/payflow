import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Tooltip,
  Typography
} from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { Add, Check, MoreHoriz, PlayForWork, Warning } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { green, red } from '@mui/material/colors';
import { FlowSettingsMenu } from './FlowSettingsMenu';
import { PiTipJar } from 'react-icons/pi';

export type ChooseFlowMenuProps = MenuProps &
  CloseCallbackType & {
    configurable?: boolean;
    flows: FlowType[];
    selectedFlow: FlowType;
    setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export function ChooseFlowMenu({
  configurable = true,
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
        <Menu
          onClose={closeStateCallback}
          sx={{ mt: 1, maxWidth: 365, '.MuiMenu-paper': { borderRadius: 5 } }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
          {...props}>
          <MenuList dense disablePadding>
            <MenuItem disabled key="payment_flow_title">
              <Typography fontWeight="bold" fontSize={16}>
                Payment Flows
              </Typography>
            </MenuItem>
            {flows &&
              flows.map((option) => (
                <MenuItem
                  key={option.uuid}
                  selected={option.uuid === selectedFlow.uuid}
                  sx={{ alignContent: 'center' }}
                  onClick={async () => {
                    setSelectedFlow(option);
                    closeStateCallback();
                  }}>
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%">
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="flex-start">
                      <Box
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="flex-start"
                        width={90}>
                        <Box display="inherit" width={30}>
                          {option.uuid === selectedFlow.uuid && (
                            <Check sx={{ color: green.A700 }} />
                          )}
                        </Box>
                        <Box display="inherit" width={30}>
                          {option.uuid === profile.defaultFlow?.uuid && (
                            <Tooltip title="Default receiving payment flow">
                              <PlayForWork />
                            </Tooltip>
                          )}
                        </Box>

                        {option.type === 'JAR' && (
                          <Tooltip title="Jar">
                            <PiTipJar size={20} />
                          </Tooltip>
                        )}

                        {option.type === 'FARCASTER_VERIFICATION' && (
                          <Tooltip title="Farcaster Verification">
                            <Box
                              src="/farcaster.svg"
                              component="img"
                              sx={{ width: 20, height: 20 }}
                            />
                          </Tooltip>
                        )}

                        {option.type === 'LINKED' && (
                          <Tooltip title="Linked Wallet">
                            <Box
                              src="/coinbase_smart_wallet.svg"
                              component="img"
                              sx={{ width: 20, height: 20 }}
                            />
                          </Tooltip>
                        )}

                        {option.wallets.length > 0 &&
                          option.wallets.find((w) => w.version === '1.3.0') && (
                            <Tooltip
                              arrow
                              title={
                                <Typography variant="subtitle2" color={red[400]} width="300">
                                  Legacy flows will be decomissioned soon! <br />
                                  Please, move your funds to other flows.
                                </Typography>
                              }>
                              <Warning fontSize="small" sx={{ color: red[400] }} />
                            </Tooltip>
                          )}
                      </Box>
                      <Typography variant="subtitle2" noWrap maxWidth={180}>
                        {option.title}
                      </Typography>
                    </Box>

                    {configurable &&
                      option === selectedFlow &&
                      option.uuid !== profile.defaultFlow?.uuid && (
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
              ))}
            {configurable && (
              <>
                <Divider />
                <MenuItem
                  disabled
                  key="add_payment_flow"
                  onClick={async () => {
                    setOpenNewFlowDialig(true);
                  }}>
                  <Add fontSize="small" sx={{ width: 30, color: green.A700 }} />
                  <Typography variant="subtitle2" color={green.A700}>
                    New Payment Flow
                  </Typography>
                </MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
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
            flow={selectedFlow}
          />
        )}
      </>
    )
  );
}
