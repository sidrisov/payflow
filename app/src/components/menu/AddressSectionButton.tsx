import { Box, Button, ButtonProps } from '@mui/material';
import { IdentityType } from '../../types/ProfileType';
import { AddressSection } from '../AddressSection';
import { useMobile } from '../../utils/hooks/useMobile';

export default function AddressSectionButton({
  identity,
  ...props
}: ButtonProps & { identity: IdentityType }) {
  const smallScreen = useMobile();

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
