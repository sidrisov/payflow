import { Badge, Box, Divider, Menu, MenuItem, MenuProps, Tooltip, Typography } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { Add, Check, Star, Verified, Warning } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { green, red } from '@mui/material/colors';

export type ChooseFlowMenuProps = MenuProps &
  CloseCallbackType & {
    flows: FlowType[];
    selectedFlow: FlowType;
    setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export function ChooseFlowMenu({
  flows,
  selectedFlow,
  setSelectedFlow,
  closeStateCallback,
  ...props
}: ChooseFlowMenuProps) {
  const { profile } = useContext(ProfileContext);
  const [openNewFlowDialig, setOpenNewFlowDialig] = useState<boolean>(false);

  return (
    profile && (
      <>
        <Menu
          {...props}
          onClose={closeStateCallback}
          sx={{ mt: 1, maxWidth: 300, '.MuiMenu-paper': { borderRadius: 5 } }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}>
          <MenuItem disabled key="payment_flow_title">
            <Typography fontWeight="bold" fontSize={16}>
              Payment Flows
            </Typography>
          </MenuItem>
          {flows &&
            flows.map((option) => (
              <MenuItem
                key={option.uuid}
                selected={option === selectedFlow}
                onClick={async () => {
                  setSelectedFlow(option);
                  closeStateCallback();
                }}>
                <Box display="flex" alignItems="center" justifyContent="center" width={30}>
                  {option.uuid === profile.defaultFlow?.uuid && (
                    <Tooltip title="Primary">
                      <Star />
                    </Tooltip>
                  )}

                  {option.type === 'JAR' && (
                    <Tooltip title="Jar">
                      <Box src="/jar.png" component="img" sx={{ width: 20, height: 20 }} />
                    </Tooltip>
                  )}

                  {option.type === 'FARCASTER_VERIFICATION' && (
                    <Tooltip title="Farcaster Verified Address">
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<Verified sx={{ width: 15, height: 15 }} />}>
                        <Box src="/farcaster.svg" component="img" sx={{ width: 20, height: 20 }} />
                      </Badge>
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
                <Box
                  width={200}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between">
                  <Typography variant="subtitle2" overflow="clip">
                    {option.title}
                  </Typography>
                  {option === selectedFlow && <Check sx={{ mx: 1, color: green.A700 }} />}
                </Box>
              </MenuItem>
            ))}
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
      </>
    )
  );
}
