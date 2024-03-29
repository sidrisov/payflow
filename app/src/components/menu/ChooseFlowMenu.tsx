import { Box, Menu, MenuItem, MenuProps, Tooltip, Typography } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { Check, Star } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { green } from '@mui/material/colors';

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

  return (
    profile && (
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
                  <Tooltip title="Primary">
                    <Star />
                  </Tooltip>
                )}

                {option.type === 'JAR' && (
                  <Tooltip title="Jar">
                    <Box src="/jar.png" component="img" sx={{ width: 20, height: 20 }} />
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
      </Menu>
    )
  );
}
