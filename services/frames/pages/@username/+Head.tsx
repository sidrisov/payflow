import { usePageContext } from 'vike-react/usePageContext';
import { DAPP_URL, FRAMES_URL, API_URL } from '../../utils/constants';

export function Head() {
  const { routeParams, urlParsed } = usePageContext();
  const username = routeParams?.username;

  const entryTitle = urlParsed.search.entryTitle;

  const imageUrl = `${FRAMES_URL}/images/profile/${username}/payment.png?step=start${entryTitle ? `&entryTitle=${entryTitle}` : ''}`;
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

        <meta property="fc:frame:image" content={`${imageUrl}`} />
        <meta property="fc:frame:input:text" content="50 degen or 100 moxie" />
        <meta property="fc:frame:button:1" content="Confirm" />
        <meta
          property="fc:frame:button:1:target"
          content={`${API_URL}/api/farcaster/frames/pay/${username}/frame/command`}
        />
        <meta property="fc:frame:button:2" content="App" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content={`${DAPP_URL}/${username}?pay`} />

        <meta property="fc:frame:button:3" content="Action" />
        <meta property="fc:frame:button:3:action" content="link" />
        <meta
          property="fc:frame:button:3:target"
          content={`https://warpcast.com/~/add-cast-action?url=${API_URL}/api/farcaster/actions/profile`}
        />
        <meta property="fc:frame:button:4" content="Tokens" />
        <meta property="fc:frame:button:4:action" content="link" />
        <meta
          property="fc:frame:button:4:target"
          content="https://payflowlabs.notion.site/Payflow-support-tokens-chains-e36f2c1e9f7e4bfd834baf604ce9a375"
        />
      </head>
    </>
  );
}
