import { Badge, Box, Menu, MenuItem, MenuProps, Tooltip, Typography } from '@mui/material';
import { FlowType } from '../types/FlowType';
import { Check, Star, Stars } from '@mui/icons-material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

export function ChooseFlowMenu(
  props: MenuProps &
    CloseCallbackType & {
      flows: FlowType[];
      selectedFlow: FlowType;
      setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
    }
) {
  const { flows, selectedFlow, setSelectedFlow, closeStateCallback } = props;

  const { profile } = useContext(UserContext);
  return (
    <Menu
      {...props}
      onClose={closeStateCallback}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
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
                <Tooltip title="Default flow">
                  <Stars fontSize="small" />
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
              {option === selectedFlow && <Check color="success" sx={{ ml: 1 }} />}
            </Box>
          </MenuItem>
        ))}
    </Menu>
  );
}
