import { Box, Button, ButtonProps } from '@mui/material';
import { MetaType } from '../types/ProfleType';
import { AddressSection } from './AddressSection';

export default function AddressSectionButton({ meta, ...props }: ButtonProps & { meta: MetaType }) {
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
      <AddressSection meta={meta} />
    </Box>
  );
}
