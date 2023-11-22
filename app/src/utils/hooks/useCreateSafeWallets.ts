import { useCallback, useState } from 'react';
import { Address, Chain } from 'viem';
import createSafeWallets from '../createSafeWallets';

export type SafeWallet = {
  chain: Chain;
  address: Address;
};

export const useCreateSafeWallets = (): {
  loading: boolean;
  created: boolean;
  wallets: { chain: Chain; address: Address }[] | undefined;
  create: (owner: Address, saltNonce: string, chains: Chain[]) => Promise<void>;
} => {
  const [created, setCreated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [wallets, setWallets] = useState<{ chain: Chain; address: Address }[]>();

  const create = useCallback(async function (owner: Address, saltNonce: string, chains: Chain[]) {
    setLoading(true);
    try {
      const wallets = await createSafeWallets(owner, saltNonce, chains);
      setLoading(false);
      setCreated(true);
      setWallets(wallets);
    } catch (error) {
      console.log(error);
      setCreated(false);
      setLoading(false);
    }
  }, []);
  return { loading, created, wallets, create };
};
