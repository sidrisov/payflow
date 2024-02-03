export { Head };

function Head() {
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

        <title>Payflow | Search & Pay</title>
        <meta
          name="description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />

        <meta property="og:url" content="https://app.payflow.me" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Payflow | Search & Pay" />
        <meta
          property="og:description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta property="og:image" content="https://i.imgur.com/Vs0loYg.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.payflow.me" />
        <meta property="twitter:url" content="https://app.payflow.me" />
        <meta name="twitter:title" content="Payflow | Search & Pay" />
        <meta
          name="twitter:description"
          content="Onchain Social Payments across Farcaster, Lens, and Ens."
        />
        <meta name="twitter:image" content="https://i.imgur.com/Vs0loYg.png" />

        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://i.imgur.com/Vs0loYg.png" />
        <meta property="fc:frame:button:1" content="Connect" />
        <meta
          property="fc:frame:post_url"
          content="https://api.alpha.payflow.me/api/farcaster/frames/connect"
        />
      </head>
    </>
  );
}
