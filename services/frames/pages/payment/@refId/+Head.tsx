import { API_URL, DAPP_URL, FRAMES_URL } from '../../../utils/constants';
import { Data } from './+data';
import { useData } from 'vike-react/useData';

export function Head() {
  const payment = useData<Data>();
  const refId = payment.referenceId;
  const status = payment.status;
  const type = payment.type;

  const identity = payment.receiver?.identity ?? payment.receiverAddress;

  const imageUrl =
    status === 'PENDING'
      ? type === 'INTENT'
        ? `${FRAMES_URL}/images/profile/${identity}/payment.png?step=execute&chainId=${payment.chainId}&token=${payment.token}&usdAmount=${payment.usdAmount ?? ''}&tokenAmount=${payment.tokenAmount ?? ''}`
        : `${FRAMES_URL}/images/profile/${identity}/payment.png?step=confirm&chainId=${payment.chainId}&token=${payment.token}&usdAmount=${payment.usdAmount ?? ''}&tokenAmount=${payment.tokenAmount ?? ''}`
      : `${FRAMES_URL}/images/profile/${identity}/payment.png?step=execute&chainId=${payment.chainId}&token=${payment.token}&usdAmount=${payment.usdAmount ?? ''}&tokenAmount=${payment.tokenAmount ?? ''}&status=success`;
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

        {status === 'PENDING' ? (
          type === 'INTENT' ? (
            <>
              <meta property="fc:frame:button:1" content="App" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta
                property="fc:frame:button:1:target"
                content={DAPP_URL.concat(`?pay=${refId}`)}
              />
            </>
          ) : (
            <>
              <meta
                property="fc:frame:post_url"
                content={`${API_URL}/api/farcaster/frames/pay/${refId}/frame/confirm`}
              />
              <meta property="fc:frame:button:1" content="💜 Pay" />
              <meta property="fc:frame:button:1:action" content="tx" />
              <meta
                property="fc:frame:button:1:target"
                content={`${API_URL}/api/farcaster/frames/pay/${refId}/frame/confirm`}
              />
              <meta property="fc:frame:button:2" content="App" />
              <meta property="fc:frame:button:2:action" content="link" />
              <meta
                property="fc:frame:button:2:target"
                content={DAPP_URL.concat(`?pay=${refId}`)}
              />

              <meta property="fc:frame:button:3" content="Add action" />
              <meta property="fc:frame:button:3:action" content="link" />
              <meta
                property="fc:frame:button:3:target"
                content={`https://warpcast.com/~/add-cast-action?url=${API_URL}/api/farcaster/actions/profile`}
              />

              <meta property="fc:frame:button:4" content="FAQ" />
              <meta property="fc:frame:button:4:action" content="link" />
              <meta
                property="fc:frame:button:4:target"
                content="https://payflowlabs.notion.site/FAQs-20593cf7734e4d78ad0dc91c8e8982e5"
              />
            </>
          )
        ) : (
          <>
            <meta property="fc:frame:button:1" content="🔎 Receipt" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta
              property="fc:frame:button:1:target"
              content={`https://onceupon.gg/${payment.hash}`}
            />
          </>
        )}
      </head>
    </>
  );
}
