import type { PageContextServer } from 'vike/types';
import { fetchCollectionOwner, MintUrlParams } from '../../utils/mint';

export type Data = Awaited<ReturnType<typeof data>>;

export const data = async (pageContext: PageContextServer) => {
  const { chainId, contract } = pageContext.urlParsed.search as unknown as MintUrlParams;
  try {
    return await fetchCollectionOwner(parseInt(chainId), contract);
  } catch (error) {
    console.error('Failed to fetch mint data:', error);
    return;
  }
};
