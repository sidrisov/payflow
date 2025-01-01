import { useCallback, useState } from 'react';
import { Address, Chain } from 'viem';
import { generateWallet } from '@payflow/common';
import { FlowWalletType } from '../../types/FlowType';
import { useConfig } from 'wagmi';

export type SafeWallet = {
  chain: Chain;
  address: Address;
};

export const useCreateSafeWallets = (): {
  loading: boolean;
  error: boolean;
  wallets: FlowWalletType[] | undefined;
  generate: (owners: Address[], saltNonce: string, chainIds: number[]) => Promise<void>;
  reset: () => Promise<void>;
} => {
  const wagmiConfig = useConfig();
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [wallets, setWallets] = useState<FlowWalletType[]>();

  const generate = useCallback(async function (
    owners: Address[],
    saltNonce: string,
    chainIds: number[]
  ) {
    setLoading(true);
    try {
      const wallets = await generateWallet(wagmiConfig, owners, saltNonce, chainIds);
      setLoading(false);
      setWallets(wallets);
    } catch (error) {
      console.error(error);
      setError(true);
      setLoading(false);
    }
  }, []);

  const reset = useCallback(async function () {
    setLoading(false);
    setError(false);
    setWallets(undefined);
  }, []);
  return { loading, error, wallets, generate, reset };
};
