import { Link, LinkProps, Typography } from '@mui/material';
import { socialLink } from '../utils/dapps';
import { Address } from 'viem';
import { shortenWalletAddressLabel } from '../utils/address';
import { useMobile } from '../utils/hooks/useMobile';

export function AddressOrEnsWithLink({
  address,
  ens,
  blockExplorerUrl,
  ...props
}: { address: Address; ens?: string; blockExplorerUrl?: string } & LinkProps) {
  const isMobile = useMobile();

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
