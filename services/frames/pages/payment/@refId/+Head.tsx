import { usePageContext } from 'vike-react/usePageContext';
import { API_URL, DAPP_URL, FRAMES_URL } from '../../../utils/constants';
import { getReceiptUrl } from '../../../utils/networks';
import { Data } from './+data';
import { useData } from 'vike-react/useData';

export function Head() {
  const { urlParsed } = usePageContext();

  const isMiniApp = urlParsed.search.mini !== undefined && urlParsed.search.mini !== 'false';

  const payment = useData<Data>();
  const refId = payment.referenceId;
  const status = payment.status;

  const identity = payment.receiver?.identity ?? payment.receiverAddress;

  const imageUrl =
    status === 'CREATED'
      ? /* type === 'INTENT'
        ? `${FRAMES_URL}/images/profile/${identity}/payment.png?step=execute&chainId=${payment.chainId}&token=${payment.token}&usdAmount=${payment.usdAmount ?? ''}&tokenAmount=${payment.tokenAmount ?? ''}`
        : */ `${FRAMES_URL}/images/profile/${identity}/payment.png?step=confirm&chainId=${payment.chainId}&token=${payment.token}&usdAmount=${payment.usdAmount ?? ''}&tokenAmount=${payment.tokenAmount ?? ''}`
      : `${FRAMES_URL}/images/profile/${identity}/payment.png?step=execute&chainId=${payment.chainId}&token=${payment.token}&usdAmount=${payment.usdAmount ?? ''}&tokenAmount=${payment.tokenAmount ?? ''}&status=success`;

  const receiptUrl = getReceiptUrl(payment.chainId, payment.hash ?? payment.fulfillmentHash);

  const activityUrl =
    'https://warpcast.com/~/composer-action?url=https://api.alpha.payflow.me/api/farcaster/composer/pay?action=activity';

  const composerUrl = `${API_URL}/api/farcaster/composer/pay?action=payment&refId=${refId}`;
  const miniAppUrl = `https://warpcast.com/~/composer-action?url=${encodeURIComponent(composerUrl)}`;

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

        {status === 'CREATED' ? (
          <>
            <meta
              property="fc:frame:post_url"
              content={`${API_URL}/api/farcaster/frames/pay/${refId}/frame/confirm`}
            />
            <meta property="fc:frame:button:1" content="Quick" />
            <meta property="fc:frame:button:1:action" content="tx" />
            <meta
              property="fc:frame:button:1:target"
              content={`${API_URL}/api/farcaster/frames/pay/${refId}/frame/confirm`}
            />
            <meta property="fc:frame:button:2" content="Advanced ⚡" />
            <meta property="fc:frame:button:2:action" content="link" />
            <meta
              property="fc:frame:button:2:target"
              content={isMiniApp ? miniAppUrl : DAPP_URL.concat(`/payment/${refId}`)}
            />
          </>
        ) : (
          <>
            <meta property="fc:frame:button:1" content="Receipt" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content={receiptUrl} />
            <meta property="fc:frame:button:2" content="History" />
            <meta property="fc:frame:button:2:action" content="link" />
            <meta property="fc:frame:button:2:target" content={activityUrl} />
            {/*  <meta property="fc:frame:button:2" content="🌟 Tip" />
            <meta property="fc:frame:button:2:action" content="post" />
            <meta property="fc:frame:button:2:target" content={TIP_PAYFLOW_URL} /> */}
          </>
        )}
      </head>
    </>
  );
}
