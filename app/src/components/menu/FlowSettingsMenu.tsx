import { ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { PlayForWork } from '@mui/icons-material';
import { FlowType } from '../../types/FlowType';
import { setReceivingFlow } from '../../services/flow';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { delay } from '../../utils/delay';

export function FlowSettingsMenu({ flow, ...props }: MenuProps & { flow: FlowType }) {
  const navigate = useNavigate();

  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        <MenuItem
          onClick={async () => {
            if (await setReceivingFlow(flow.uuid)) {
              toast.success('Saved! Reloading page ...', { isLoading: true });
              await delay(1000);
              navigate(0);
            } else {
              toast.error('Something went wrong!');
            }
          }}>
          <ListItemIcon>
            <PlayForWork />
          </ListItemIcon>
          Make default for receiving
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
