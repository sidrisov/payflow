import { Box, Button, ButtonProps, useMediaQuery, useTheme } from '@mui/material';
import { IdentityType } from '../types/ProfleType';
import { AddressSection } from './AddressSection';

export default function AddressSectionButton({
  identity,
  ...props
}: ButtonProps & { identity: IdentityType }) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      {...props}
      display="flex"
      flexDirection="row"
      justifyContent="flex-start"
      color="inherit"
      component={Button}
      textTransform="none"
      sx={{ borderRadius: 5 }}>
      <AddressSection identity={identity} fontSize={smallScreen ? 13 : 15} />
    </Box>
  );
}
