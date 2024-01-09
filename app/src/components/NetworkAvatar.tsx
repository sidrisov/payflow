import { Avatar, AvatarProps, Tooltip } from '@mui/material';
import getNetworkImageSrc, { SUPPORTED_CHAINS, getNetworkDisplayName } from '../utils/networks';
import { Chain } from 'wagmi';
import { pink } from '@mui/material/colors';

function isTestnetChain(chains: Chain[], chainId: number): boolean {
  return chains.find((c) => c.id === chainId)?.testnet ?? false;
}

export default function NetworkAvatar({
  network,
  tooltip,
  ...props
}: AvatarProps & {
  network: string | number;
  tooltip?: boolean;
}) {
  const { sx: sxProps, ...restProps } = props;

  const imageSrc = getNetworkImageSrc(network);
  const title = tooltip ? getNetworkDisplayName(network) : '';

  const testnet = isTestnetChain(SUPPORTED_CHAINS, network as number) ?? false;

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
