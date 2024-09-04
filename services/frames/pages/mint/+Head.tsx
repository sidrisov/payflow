import { usePageContext } from 'vike-react/usePageContext';
import { API_URL, DAPP_URL, FRAMES_URL } from '../../utils/constants';

interface MintUrlParams {
  original: string;
  provider: string;
  chainId: string;
  contract: string;
  referral?: string;
  tokenId?: string;
}

export function Head() {
  const { urlParsed } = usePageContext();
  const { original, provider, chainId, contract, referral, tokenId }: MintUrlParams =
    urlParsed.search as unknown as MintUrlParams;

  const imageUrl = `${FRAMES_URL}/images/mint.png?provider=${provider}&chainId=${chainId}&contract=${contract}&tokenId=${tokenId}`;

  const paymentMintSubmitUrl = new URL(`${API_URL}/api/farcaster/frames/mint/submit`);
  paymentMintSubmitUrl.searchParams.append('provider', provider);
  paymentMintSubmitUrl.searchParams.append('chainId', chainId);
  paymentMintSubmitUrl.searchParams.append('contract', contract);
  paymentMintSubmitUrl.searchParams.append('tokenId', tokenId ?? '');
  paymentMintSubmitUrl.searchParams.append('referral', referral ?? '');
  paymentMintSubmitUrl.searchParams.append('original', original);

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
        <meta property="og:title" content="Payflow | Frames" />
        <meta
          property="og:description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta property="og:image" content="https://i.imgur.com/Vs0loYg.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.payflow.me" />
        <meta property="twitter:url" content={DAPP_URL} />
        <meta name="twitter:title" content="Payflow | Frames" />
        <meta
          name="twitter:description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta name="twitter:image" content="https://i.imgur.com/Vs0loYg.png" />

        <meta property="of:version" content="vNext" />
        <meta property="of:accepts:xmtp" content="2024-02-01" />
        <meta property="of:accepts:lens" content="1.1" />

        <meta property="fc:frame" content="vNext" />

        <meta property="fc:frame:image" content={imageUrl} />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />

        <meta property="fc:frame:button:1" content="Mint" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content={paymentMintSubmitUrl.toString()} />
        <meta
          property="fc:frame:button:2"
          content={`View on ${provider === 'zora.co' ? 'Zora' : 'Rodeo'}`}
        />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content={original} />
      </head>
    </>
  );
}
