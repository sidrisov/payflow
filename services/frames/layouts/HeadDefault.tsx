import { DAPP_URL } from '../utils/constants';

export default function HeadDefault() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="theme-color" content="#ffffff" />

      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      <title>Payflow | Frames</title>
      <meta name="description" content="Onchain Social Payments across Farcaster, Lens, and Ens." />

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

      {/*       <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://i.imgur.com/Vs0loYg.png" />
      <meta property="fc:frame:button:1" content="Connect" /> */}
    </>
  );
}
