import { Stack } from '@mui/material';
import { WalletSection } from '../WalletSection';
import { FlowType, FlowWalletType } from '@payflow/common';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { isSupportedChain } from '../../utils/networks';

export function WalletBalanceDialog({
  open,
  onClose,
  flow,
  balanceFetchResult
}: {
  open: boolean;
  onClose: () => void;
  flow: FlowType;
  balanceFetchResult: BalanceFetchResultType;
}) {
  function calculateBalance(wallet: FlowWalletType) {
    if (balanceFetchResult && balanceFetchResult.balances) {
      return balanceFetchResult.balances
        .filter((balance) => balance.balance && balance.asset.chainId === wallet.network)
        .reduce((previousValue, currentValue) => {
          return previousValue + currentValue.usdValue;
        }, 0)
        .toFixed(1);
    } else {
      return 'N/A';
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={
        flow.type === 'FARCASTER_VERIFICATION' || flow.type === 'CONNECTED'
          ? 'Wallets Balance'
          : 'Smart Wallets Balance'
      }
      width={360}>
      <Stack spacing={0.5} direction="column">
        {flow.wallets
          .filter((wallet) => wallet.network && isSupportedChain(wallet.network))
          .map((wallet) => (
            <WalletSection
              key={`wallet_popover_list_${wallet.network}`}
              wallet={wallet}
              balance={calculateBalance(wallet)}
            />
          ))}
      </Stack>
    </ResponsiveDialog>
  );
}
