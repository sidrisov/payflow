import { formatEther } from 'viem';
import { getBalance } from 'wagmi/actions';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { wagmiConfig } from './wagmiConfig';

export async function getFlowBalance(flow: FlowType, ethUsdPrice: number) {
  const balances = (
    await Promise.all(
      flow.wallets.map(async (wallet) => {
        return getWalletBalance(wallet);
      })
    )
  ).map((result) => result.value);

  const totalBalance = formatEther(
    balances.reduce((previousValue, currentValue) => {
      return previousValue + currentValue;
    }, BigInt(0))
  );

  return (parseFloat(totalBalance) * ethUsdPrice).toFixed(1);
}

export async function getWalletBalance(wallet: FlowWalletType) {
  const balance = await getBalance(wagmiConfig, {
    address: wallet.address,
    chainId: wallet.network
  });

  return balance;
}

export async function getTotalBalance(balances: bigint[]) {
  return balances.reduce((previousValue, currentValue) => {
    return previousValue + currentValue;
  }, BigInt(0));
}

export function convertToUSD(value: bigint | undefined, price: number | undefined) {
  if (value !== undefined && price !== undefined) {
    return (parseFloat(formatEther(value)) * price).toFixed(1);
  }
  return 'N/A';
}
