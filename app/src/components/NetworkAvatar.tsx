import { Avatar, AvatarProps, Tooltip } from '@mui/material';
import getNetworkImageSrc, { SUPPORTED_CHAINS, getNetworkDisplayName } from '../utils/networks';
import { pink } from '@mui/material/colors';
import { Chain } from 'viem';

function isTestnetChain(chains: Chain[], chainId: number): boolean {
  return chains.find((c) => c.id === chainId)?.testnet ?? false;
}

export default function NetworkAvatar({
  chainId,
  tooltip,
  ...props
}: AvatarProps & {
  chainId: number;
  tooltip?: boolean;
}) {
  const { sx: sxProps, ...restProps } = props;

  const imageSrc = getNetworkImageSrc(chainId);
  const title = tooltip ? getNetworkDisplayName(chainId) : '';

  const testnet = isTestnetChain(SUPPORTED_CHAINS, chainId) ?? false;

  return tooltip ? (
    <Tooltip title={title}>
      <Avatar
        {...restProps}
        src={imageSrc}
        sx={{
          ...sxProps,
          p: testnet ? 0.1 : 0,
          border: testnet ? 1.5 : 0,
          borderStyle: testnet ? 'dotted' : 'inherit',
          borderColor: testnet ? pink.A200 : 'inherit'
        }}
      />
    </Tooltip>
  ) : (
    <Avatar
      {...restProps}
      src={imageSrc}
      sx={{
        ...sxProps,
        p: testnet ? 0.1 : 0,
        border: testnet ? 1.5 : 0,
        borderStyle: testnet ? 'dotted' : 'inherit',
        borderColor: testnet ? pink.A200 : 'inherit'
      }}
    />
  );
}
