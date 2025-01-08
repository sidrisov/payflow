import { SelectAll } from '@mui/icons-material';
import { ChipProps, Chip, Typography } from '@mui/material';
import { Chain } from 'viem';
import { WalletType } from '@payflow/common';
import { useConfig } from 'wagmi';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { getNetworkDisplayName } from '../../utils/networks';
import { useMobile } from '../../utils/hooks/useMobile';

export default function NetworkSelectorChip({
  wallet,
  selectedNetwork,
  setSelectedNetwork,
  ...props
}: ChipProps & {
  wallet?: WalletType;
  selectedNetwork: Chain | undefined;
  setSelectedNetwork: React.Dispatch<React.SetStateAction<Chain | undefined>>;
}) {
  const smallScreen = useMobile();

  const { chains } = useConfig();

  return (
    <Chip
      {...props}
      clickable
      icon={
        wallet ? (
          <NetworkAvatar chainId={wallet.network} sx={{ width: 20, height: 20 }} />
        ) : (
          <SelectAll />
        )
      }
      label={
        <Typography variant={!smallScreen ? 'subtitle2' : 'caption'}>
          {wallet ? getNetworkDisplayName(wallet.network) : 'All networks'}
        </Typography>
      }
      onClick={async () => {
        if (wallet) {
          setSelectedNetwork(chains.find((c) => c.id === wallet.network));
        } else {
          setSelectedNetwork(undefined);
        }
      }}
      sx={{
        backgroundColor: (
          wallet ? selectedNetwork?.id === wallet.network : selectedNetwork === undefined
        )
          ? ''
          : 'inherit'
      }}
    />
  );
}
