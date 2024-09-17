import { useEnsAvatar, useEnsName } from 'wagmi';

export const useEnsData = (address: string | undefined) => {
  const { data: ensName, isFetching: isFetchingEnsName } = useEnsName({
    address: address ? (address as `0x${string}`) : undefined,
    chainId: 1,
    query: {
      enabled: !!address,
      staleTime: 300_000
    }
  });

  const { data: ensAvatar, isFetching: isFetchingEnsAvatar } = useEnsAvatar({
    name: ensName as string,
    chainId: 1,
    query: {
      enabled: !!ensName,
      staleTime: 300_000
    }
  });

  return { ensName, ensAvatar, isFetching: isFetchingEnsName || isFetchingEnsAvatar };
};
