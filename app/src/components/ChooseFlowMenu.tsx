import { Box, Menu, MenuItem, MenuProps, Typography } from '@mui/material';
import { FlowType } from '../types/FlowType';
import { Check } from '@mui/icons-material';

export function ChooseFlowMenu(
  props: MenuProps & {
    flows: FlowType[];
    selectedFlow: FlowType;
    setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  }
) {
  const { flows, selectedFlow, setSelectedFlow } = props;
  return (
    <Menu
      {...props}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      {flows &&
        flows.map((option) => (
          <MenuItem
            key={option.uuid}
            selected={option === selectedFlow}
            onClick={() => setSelectedFlow(option)}>
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
