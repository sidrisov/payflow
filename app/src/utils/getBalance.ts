import { Chain, formatEther } from 'viem';
import { fetchBalance } from 'wagmi/actions';
import { FlowType, FlowWalletType } from '../types/FlowType';

export async function getFlowBalance(flow: FlowType, chains: Chain[], ethPrice: number) {
  const balances = (
    await Promise.all(
      flow.wallets.map(async (wallet) => {
        return getWalletBalance(wallet, chains);
      })
    )
  ).map((result) => result.value);

  const totalBalance = formatEther(
    balances.reduce((previousValue, currentValue) => {
      return previousValue + currentValue;
    }, BigInt(0))
  );

  return (parseFloat(totalBalance) * ethPrice).toFixed(1);
}

export async function getWalletBalance(wallet: FlowWalletType, chains: Chain[]) {
  const balance = await fetchBalance({
    address: wallet.address,
    chainId: chains.find((c) => c?.name === wallet.network)?.id
  });

  return balance;
}

export async function getTotalBalance(balances: bigint[]) {
  return balances.reduce((previousValue, currentValue) => {
    return previousValue + currentValue;
  }, BigInt(0));
}

export function convertToUSD(value: bigint | undefined, price: number) {
  if (value !== undefined) {
    return (parseFloat(formatEther(value)) * price).toFixed(1);
  }
  return 'N/A';
}
