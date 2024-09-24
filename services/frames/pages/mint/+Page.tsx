import { usePageContext } from 'vike-react/usePageContext';
import { MintUrlParams } from '../../utils/mint';
import { useEffect } from 'react';

export default function Page() {
  const { urlParsed } = usePageContext();
  const { provider, chainId, contract, tokenId, referral } =
    urlParsed.search as unknown as MintUrlParams;

  const providerInfo = {
    'zora.co': {
      name: 'Zora',
      url: (chainId: string, contract: string, tokenId?: string, referral?: string) =>
        `https://zora.co/collect/${chainId}:${contract}/${tokenId || ''}${referral ? `?referrer=${referral}` : ''}`
    },
    'highlight.xyz': {
      name: 'Highlight',
      url: (chainId: string, contract: string, tokenId?: string, referral?: string) =>
        `https://highlight.xyz/mint/${chainId}:${contract}${tokenId ? `/${tokenId}` : ''}${referral ? `?referrer=${referral}` : ''}`
    },
    'rodeo.club': {
      name: 'Rodeo',
      url: (chainId: string, contract: string, tokenId?: string, referral?: string) =>
        `https://rodeo.club/post/${contract}/${tokenId || ''}${referral ? `?referrer=${referral}` : ''}`
    }
  };

  const providerUrl = providerInfo[provider as keyof typeof providerInfo]?.url(
    chainId,
    contract,
    tokenId,
    referral
  );

  useEffect(() => {
    if (providerUrl) {
      window.location.href = providerUrl;
    }
  }, [providerUrl]);

  return (
    <>
      <span>Cross-Chain Mint</span>
      <p>Redirecting to {provider}</p>
    </>
  );
}
