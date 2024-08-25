import { Popover, PopoverProps, Stack, Typography } from '@mui/material';
import { WalletSection } from '../WalletSection';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';

export function WalletsInfoPopover({
  flow,
  balanceFetchResult,
  ...props
}: PopoverProps & { flow: FlowType; balanceFetchResult: BalanceFetchResultType }) {
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
    <Popover
      elevation={15}
      {...props}
      sx={{ mt: 1, '.MuiPopover-paper': { borderRadius: 5 }, zIndex: 1400 }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      <Stack m={1} spacing={0.5} direction="column">
        <Typography fontWeight="bold" fontSize={16} textAlign="center" color="grey">
          {flow.type === 'FARCASTER_VERIFICATION' ? 'Wallets' : 'Smart Wallets'}
        </Typography>
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
