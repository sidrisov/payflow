import { Link, LinkProps, Typography, useMediaQuery, useTheme } from '@mui/material';
import { socialLink } from '../utils/dapps';
import { Address } from 'viem';
import { shortenWalletAddressLabel } from '../utils/address';

export function AddressOrEnsWithLink({
  address,
  ens,
  blockExplorerUrl,
  ...props
}: { address: Address; ens?: string; blockExplorerUrl?: string } & LinkProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Link
      maxWidth={200}
      href={
        ens
          ? socialLink('ens', ens)
          : `${blockExplorerUrl ?? 'https://etherscan.io'}/address/${address}`
      }
      target="_blank"
      underline="hover"
      color="inherit"
      overflow="clip"
      textOverflow="ellipsis"
      {...props}>
      <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
        <b>{ens ? ens : shortenWalletAddressLabel(address)}</b>
      </Typography>
    </Link>
  );
}
