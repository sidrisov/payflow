import { usePageContext } from 'vike-react/usePageContext';
import { API_URL, DAPP_URL, FRAMES_URL, MINT_FRAME_VERSION } from '../../utils/constants';
import { MintUrlParams } from '../../utils/mint';
import { useData } from 'vike-react/useData';
import { Data } from './+data';

export function Head() {
  const { urlParsed } = usePageContext();
  const { provider, chainId, contract, tokenId, referral } =
    urlParsed.search as unknown as MintUrlParams;

  const author = useData<Data>();

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

  const providerName =
    providerInfo[provider as keyof typeof providerInfo]?.name || 'Unknown Provider';
  const original =
    providerInfo[provider as keyof typeof providerInfo]?.url(
      chainId,
      contract,
      tokenId,
      referral
    ) || '';

  const imageUrl = new URL(`${FRAMES_URL}/images/mint.png`);
  imageUrl.searchParams.append('provider', provider);
  imageUrl.searchParams.append('chainId', chainId);
  imageUrl.searchParams.append('contract', contract);
  if (tokenId) {
    imageUrl.searchParams.append('tokenId', tokenId);
  }
  imageUrl.searchParams.append('v', MINT_FRAME_VERSION);

  const imageUrlString = imageUrl.toString();

  const paymentMintSubmitUrl = new URL(`${API_URL}/api/farcaster/frames/mint/submit`);
  paymentMintSubmitUrl.searchParams.append('provider', provider);
  paymentMintSubmitUrl.searchParams.append('chainId', chainId.toString());
  paymentMintSubmitUrl.searchParams.append('contract', contract);
  if (tokenId) {
    paymentMintSubmitUrl.searchParams.append('tokenId', tokenId);
  }
  if (referral) {
    paymentMintSubmitUrl.searchParams.append('referral', referral);
  }
  if (author) {
    paymentMintSubmitUrl.searchParams.append('author', author);
  }

  const baseUrl = 'https://warpcast.com/~/compose';
  const castText = encodeURIComponent(
    `Mint this collection\n\n@payflow cast action lets you mint or gift collectibles with 30+ tokens cross-chain! cc: @sinaver.eth /payflow`
  );

  const currentFrameUrl = new URL(`${FRAMES_URL}/mint`);
  currentFrameUrl.searchParams.append('provider', provider);
  currentFrameUrl.searchParams.append('chainId', chainId.toString());
  currentFrameUrl.searchParams.append('contract', contract);
  if (tokenId) {
    currentFrameUrl.searchParams.append('tokenId', tokenId);
  }
  if (referral) {
    currentFrameUrl.searchParams.append('referral', referral);
  }

  const addActionUrl =
    'https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fproducts%2Fmint';
  const shareComposeDeeplink = `${baseUrl}?text=${castText}&embeds[]=${encodeURIComponent(currentFrameUrl.toString())}`;

  return (
    <>
      <head>
        <meta charSet="UTF-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <title>Payflow | Cross-Chain Mint</title>
        <meta
          name="description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta property="og:url" content={DAPP_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Payflow | Cross-Chain Mint" />
        <meta
          property="og:description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta property="og:image" content="https://i.imgur.com/Vs0loYg.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.payflow.me" />
        <meta property="twitter:url" content={DAPP_URL} />
        <meta name="twitter:title" content="Payflow | Cross-Chain Mint" />
        <meta
          name="twitter:description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta name="twitter:image" content="https://i.imgur.com/Vs0loYg.png" />

        <meta property="of:version" content="vNext" />
        <meta property="of:accepts:xmtp" content="2024-02-01" />
        <meta property="of:accepts:lens" content="1.1" />

        <meta property="fc:frame" content="vNext" />

        <meta property="fc:frame:image" content={imageUrlString} />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:input:text" content="Gift username (blank for self)" />

        <meta property="fc:frame:button:1" content="✨ Mint" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content={paymentMintSubmitUrl.toString()} />
        <meta property="fc:frame:button:2" content={providerName} />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content={original} />

        <meta property="fc:frame:button:3" content="Action" />
        <meta property="fc:frame:button:3:action" content="link" />
        <meta property="fc:frame:button:3:target" content={addActionUrl} />

        <meta property="fc:frame:button:4" content="Share" />
        <meta property="fc:frame:button:4:action" content="link" />
        <meta property="fc:frame:button:4:target" content={shareComposeDeeplink} />
      </head>
    </>
  );
}
