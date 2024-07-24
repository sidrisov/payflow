import { Stack, StackProps } from '@mui/material';
import NetworkSelectorChip from './chips/NetworkSelectorChip';
import { WalletType } from '../types/FlowType';
import { Chain } from 'viem';

export default function NetworkSelectorSection({
  wallets,
  selectedNetwork,
  setSelectedNetwork,
  ...props
}: StackProps & {
  wallets: WalletType[];
  selectedNetwork: Chain | undefined;
  setSelectedNetwork: React.Dispatch<React.SetStateAction<Chain | undefined>>;
}) {
  return (
    <Stack
      p={1}
      direction="row"
      spacing={1}
      {...props}
      sx={{
        overflow: 'scroll',
        scrollbarWidth: 'auto', // Hide the scrollbar for firefox
        '&::-webkit-scrollbar': {
          display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
        },
        '&-ms-overflow-style:': {
          display: 'none' // Hide the scrollbar for IE
        }
      }}>
      <NetworkSelectorChip
        key={'network_selector_section_all'}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />
      {wallets.map((wallet) => {
        return (
          <NetworkSelectorChip
            key={`network_selector_section_${wallet.network}`}
            wallet={wallet}
            selectedNetwork={selectedNetwork}
            setSelectedNetwork={setSelectedNetwork}
          />
        );
      })}
    </Stack>
  );
}
