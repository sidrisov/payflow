import { Popover, PopoverProps, Stack } from '@mui/material';
import { WalletSection } from '../WalletSection';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';

export function WalletsInfoPopover({
  flow,
  balanceFetchResult,
  ...props
}: PopoverProps & { flow: FlowType; balanceFetchResult: BalanceFetchResultType }) {
  const { ethUsdPrice } = useContext(ProfileContext);

  function calculateBalance(wallet: FlowWalletType) {
    if (balanceFetchResult && ethUsdPrice) {
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
    <Popover
      {...props}
      sx={{ mt: 1, '.MuiPopover-paper': { borderRadius: 5 } }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      <Stack m={2} spacing={1} direction="column">
        {flow.wallets.map((wallet) => (
          <WalletSection
            key={`wallet_popover_list_${wallet.network}`}
            wallet={wallet}
            balance={calculateBalance(wallet)}
          />
        ))}
      </Stack>
    </Popover>
  );
}
