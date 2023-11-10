import { Box, Menu, MenuItem, MenuProps, Typography } from '@mui/material';
import { FlowType } from '../types/FlowType';
import { Check } from '@mui/icons-material';
import { CloseCallbackType } from '../types/CloseCallbackType';

export function ChooseFlowMenu(
  props: MenuProps &
    CloseCallbackType & {
      flows: FlowType[];
      selectedFlow: FlowType;
      setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
    }
) {
  const { flows, selectedFlow, setSelectedFlow, closeStateCallback } = props;
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
