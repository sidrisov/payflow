import { SelectAll } from '@mui/icons-material';
import { ChipProps, Chip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Chain } from 'viem';
import { WalletType } from '../types/FlowType';
import { useNetwork } from 'wagmi';
import NetworkAvatar from './NetworkAvatar';
import { getNetworkDisplayName } from '../utils/networks';

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
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { chains } = useNetwork();

  return (
    <Chip
      {...props}
      clickable
      icon={
        wallet ? (
          <NetworkAvatar network={wallet.network} sx={{ width: 20, height: 20 }} />
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
