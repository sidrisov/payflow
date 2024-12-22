import { DAPP_URL, FRAMES_URL, API_URL, BUY_STORAGE_FRAME_VERSION } from '../../utils/constants';

export function Head() {
  const imageUrl = `${FRAMES_URL}/images/storage.png?${BUY_STORAGE_FRAME_VERSION}`;
  const addActionUrl =
    'https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fproducts%2Fstorage';

  const baseUrl = 'https://warpcast.com/~/compose';
  const castText = encodeURIComponent(
    `Buy Farcaster Storage via @payflow frame\ncc: @sinaver.eth /payflow`
  );
  const embedUrl = `https://frames.payflow.me/storage?${BUY_STORAGE_FRAME_VERSION}`;
  const shareComposeDeeplink = `${baseUrl}?text=${castText}&embeds[]=${encodeURIComponent(embedUrl)}`;

  const notifyMiniAppUrl = `${API_URL}/api/farcaster/composer/pay?action=storage`;
  const notifyMiniAppDeeplink = `https://warpcast.com/~/composer-action?url=${encodeURIComponent(notifyMiniAppUrl)}`;
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
        <title>Payflow | Buy Storage</title>
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
        <meta property="fc:frame:input:text" content="Username (blank for self)" />

        <meta property="fc:frame:button:1" content="Usage" />
        <meta
          property="fc:frame:button:1:target"
          content={`${API_URL}/api/farcaster/frames/storage/check`}
        />

        <meta property="fc:frame:button:2" content="Notify" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content={notifyMiniAppDeeplink} />
      </head>
    </>
  );
}
