import { useCallback, useState } from 'react';
import { Address, Chain } from 'viem';
import createSafeWallets from '../createSafeWallets';
import { FlowWalletType } from '../../types/FlowType';

export type SafeWallet = {
  chain: Chain;
  address: Address;
};

export const useCreateSafeWallets = (): {
  loading: boolean;
  error: boolean;
  wallets: FlowWalletType[] | undefined;
  create: (owner: Address, saltNonce: string, chains: Chain[]) => Promise<void>;
  reset: () => Promise<void>;
} => {
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [wallets, setWallets] = useState<FlowWalletType[]>();

  const create = useCallback(async function (owner: Address, saltNonce: string, chains: Chain[]) {
    setLoading(true);
    try {
      const wallets = await createSafeWallets(owner, saltNonce, chains);
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
  return { loading, error, wallets, create, reset };
};
