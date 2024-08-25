import {
  Box,
  Divider,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Stack,
  Typography
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { green } from '@mui/material/colors';
import { Token } from '../../utils/erc20contracts';
import TokenAvatar from '../avatars/TokenAvatar';

export type ChooseTokenMenuProps = MenuProps &
  CloseCallbackType & {
    tokens: Token[];
    selectedToken: Token | undefined;
    setSelectedToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  };

export function ChooseTokenMenu({
  tokens,
  selectedToken,
  setSelectedToken,
  closeStateCallback,
  ...props
}: ChooseTokenMenuProps) {
  return (
    <Menu
      {...props}
      onClose={closeStateCallback}
      sx={{ mt: 1.5, '.MuiMenu-paper': { borderRadius: 5, minWidth: 180 }, zIndex: 1350 }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      <MenuList dense disablePadding>
        <MenuItem
          disabled
          key="choose_token_menu_title"
          sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography fontWeight="bold" fontSize={15}>
            Choose Token
          </Typography>
        </MenuItem>
        <Divider variant="middle" />
        <Stack
          maxHeight={350}
          mt={1}
          sx={{
            overflowY: 'scroll',
            '-webkit-overflow-scrolling': 'touch'
          }}>
          {tokens &&
            tokens.map((token) => (
              <MenuItem
                key={token.id}
                selected={token.id === selectedToken?.id}
                onClick={async () => {
                  setSelectedToken(token);
                  closeStateCallback();
                }}>
                <Box
                  width={120}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between">
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <TokenAvatar token={token} sx={{ width: 24, height: 24 }} />
                    <Typography ml={1}>{token.name}</Typography>
                  </Box>
                  {token === selectedToken && <Check sx={{ color: green.A700 }} />}
                </Box>
              </MenuItem>
            ))}
        </Stack>
      </MenuList>
    </Menu>
  );
}
