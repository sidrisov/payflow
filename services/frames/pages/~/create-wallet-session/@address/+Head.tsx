import { DAPP_URL } from '../../../../utils/constants';
import { usePageContext } from 'vike-react/usePageContext';

export function Head() {
  const { routeParams } = usePageContext();
  const address = routeParams.address;

  const frame = {
    version: 'next',
    imageUrl: 'https://i.imgur.com/okcGTR2.png',
    button: {
      title: 'Create Session',
      action: {
        type: 'launch_frame',
        name: 'Payflow',
        url: `${DAPP_URL}/~/create-wallet-session/${address}`,
        splashImageUrl: 'https://app.payflow.me/apple-touch-icon.png',
        splashBackgroundColor: '#f7f7f7'
      }
    }
  };

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

        <title>Payflow</title>
        <meta name="description" content="Onchain Social Payments" />

        <meta property="og:url" content={DAPP_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Payflow | App" />
        <meta property="og:description" content="Onchain Social Payments" />
        <meta property="og:image" content="https://i.imgur.com/okcGTR2.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.payflow.me" />
        <meta property="twitter:url" content={DAPP_URL} />
        <meta name="twitter:title" content="Payflow | App" />
        <meta name="twitter:description" content="Onchain Social Payments" />
        <meta name="twitter:image" content="https://i.imgur.com/okcGTR2.png" />

        <meta property="fc:frame" content={JSON.stringify(frame)} />
      </head>
    </>
  );
}
