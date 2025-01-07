import { usePageContext } from 'vike-react/usePageContext';
import { DAPP_URL, FRAMES_URL, API_URL } from '../../utils/constants';

export function Head() {
  const { routeParams, urlParsed } = usePageContext();
  const username = routeParams?.username;

  const title = urlParsed.search.entryTitle || urlParsed.search.title;
  const button = urlParsed.search.button;
  const theme = urlParsed.search.theme;

  const imageUrl = `${FRAMES_URL}/images/profile/${username}/payment.png?step=start${title ? `&entryTitle=${title}` : ''}${theme ? `&theme=${theme}` : ''}`;

  const chainId = urlParsed.search.chainId;
  const tokenId = urlParsed.search.tokenId;
  const tokenAmount = urlParsed.search.tokenAmount;
  const usdAmount = urlParsed.search.usdAmount;

  const includeInputText = !tokenAmount && !usdAmount;
  const inputText = tokenId ? `<amount> ${tokenId}` : '50 degen or 100 moxie';

  const commnandUrl = (includeInputText: boolean) => {
    const baseUrl = `${API_URL}/api/farcaster/frames/pay/${username}/frame/command`;
    const params = new URLSearchParams();

    if (theme) params.append('theme', theme);
    if (!includeInputText) {
      if (chainId) params.append('chainId', chainId);
      if (tokenId) params.append('tokenId', tokenId);
      if (tokenAmount) params.append('tokenAmount', tokenAmount);
      if (usdAmount) params.append('usdAmount', usdAmount);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const paymentButtonText = includeInputText
    ? button || 'Pay'
    : `${button || 'Pay'}: ${tokenAmount ?? `$${usdAmount}`} ${tokenId?.toUpperCase() ?? 'USDC'}`;
  const postTargetUrl = commnandUrl(includeInputText);

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
        <title>Payflow | Frames</title>
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

        {includeInputText && <meta property="fc:frame:input:text" content={inputText} />}
        <meta property="fc:frame:button:1" content={paymentButtonText} />
        <meta property="fc:frame:button:1:target" content={postTargetUrl} />
      </head>
    </>
  );
}
