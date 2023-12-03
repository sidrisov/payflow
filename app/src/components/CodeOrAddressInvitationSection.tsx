import { Box, Typography } from '@mui/material';
import CopyToClipboardIconButton from './CopyToClipboardIconButton';
import { isAddress } from 'viem';
import { shortenWalletAddressLabel } from '../utils/address';

export default function CodeOrAddressInvitationSection({
  codeOrAddress,
  count
}: {
  codeOrAddress: string;
  count?: number;
}) {
  return (
    <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
      <Typography variant="subtitle2">
        {isAddress(codeOrAddress) ? shortenWalletAddressLabel(codeOrAddress) : codeOrAddress}
      </Typography>
      {count && <Typography variant="subtitle2">{'(' + count + ')'}</Typography>}
      <CopyToClipboardIconButton
        color="inherit"
        tooltip={isAddress(codeOrAddress) ? 'Copy address' : 'Copy invite'}
        value={codeOrAddress}
      />
    </Box>
  );
}
