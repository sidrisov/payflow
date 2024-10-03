import { usePageContext } from 'vike-react/usePageContext';
import { API_URL, BUY_FAN_FRAME_VERSION, DAPP_URL, FRAMES_URL } from '../../utils/constants';

export function Head() {
  const imageUrl = `${FRAMES_URL}/images/fan.png?${BUY_FAN_FRAME_VERSION}}`;

  const { urlParsed } = usePageContext();

  // Parse the names from the query parameter, no defaults
  const names = urlParsed.searchAll.names ? urlParsed.searchAll.names : [];

  const getButtonContent = (name: string) => {
    if (name.startsWith('network:')) {
      return name.split(':')[1];
    } else if (name.startsWith('/')) {
      return name;
    }
    return `@${name}`;
  };

  const getUrlSanitizedName = (name: string) => {
    if (name.startsWith('/')) {
      return name.replace('/', 'channel:');
    }
    return name;
  };

  const addActionUrl =
    'https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fproducts%2Ffan';

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
        <title>Payflow | Buy Fan Token</title>
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

        {names.length !== 0 ? (
          <meta property="fc:frame:input:text" content="Gift username (blank for self)" />
        ) : (
          <>
            <meta property="fc:frame:button:1" content="Install Action" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content={addActionUrl} />
          </>
        )}

        {names.map((name, index) => (
          <>
            <meta property={`fc:frame:button:${index + 1}`} content={getButtonContent(name)} />
            <meta property={`fc:frame:button:${index + 1}:action`} content="post_redirect" />
            <meta
              property={`fc:frame:button:${index + 1}:target`}
              content={`${API_URL}/api/farcaster/frames/fan/${encodeURIComponent(getUrlSanitizedName(name))}/submit`}
            />
          </>
        ))}
      </head>
    </>
  );
}
