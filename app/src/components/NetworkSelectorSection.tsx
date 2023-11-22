import { Stack, StackProps } from '@mui/material';
import NetworkSelectorChip from './NetworkSelectorChip';
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
    <Stack p={1} direction="row" spacing={1} overflow="scroll" {...props}>
      <NetworkSelectorChip
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />
      {wallets.map((wallet) => {
        return (
          <NetworkSelectorChip
            wallet={wallet}
            selectedNetwork={selectedNetwork}
            setSelectedNetwork={setSelectedNetwork}
          />
        );
      })}
    </Stack>
  );
}
