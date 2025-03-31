import { usePageContext } from 'vike-react/usePageContext';
import { API_URL, DAPP_URL, FRAMES_URL } from '../../../utils/constants';
import { getReceiptUrl } from '../../../utils/networks';
import { Data } from './+data';
import { useData } from 'vike-react/useData';
import { PaymentType } from '@payflow/common';

export function Head() {
  const { urlParsed } = usePageContext();

  const isFrameV2 = urlParsed.search.fv2 !== undefined && urlParsed.search.fv2 !== 'false';

  const payment = useData<PaymentType>();

  const refId = payment.referenceId;
  const status = payment.status;

  const identity = payment.receiver?.identity ?? payment.receiverAddress;

  const receiptUrl =
    payment.status === 'COMPLETED' &&
    getReceiptUrl(payment.chainId, payment.hash ?? payment.fulfillmentHash);

  const paymentUrl = `${DAPP_URL}/payment/${refId}`;
  const launchFrameLink = `https://warpcast.com/~/mini-apps/launch?url=${encodeURIComponent(paymentUrl)}`;

  const getButtonTitle = (payment: Data) => {
    if (payment.status === 'COMPLETED') {
      return 'Receipt';
    }

    switch (payment.category) {
      case 'mint':
        return 'Mint';
      case 'storage':
        return 'Buy Storage';
      case 'hypersub':
        return 'Subscribe';
      default:
        return 'Pay';
    }
  };

  const getFrameV2ImageUrl = (payment: PaymentType) => {
    switch (payment.category) {
      case 'mint':
      case 'fc_storage':
      case 'hypersub':
        return 'https://i.imgur.com/okcGTR2.png';
      default:
        return `${FRAMES_URL}/images/payment/${refId}/image.png`;
    }
  };

  const imageUrl = isFrameV2
    ? getFrameV2ImageUrl(payment)
    : `${FRAMES_URL}/images/profile/${identity}/payment.png?refId=${refId}`;

  const frame = isFrameV2
    ? {
        version: 'next',
        imageUrl,
        button: {
          title: getButtonTitle(payment),
          action: {
            type: 'launch_frame',
            name: 'Payflow Payment',
            url: `${DAPP_URL}/payment/${refId}`,
            splashImageUrl: 'https://app.payflow.me/apple-touch-icon.png',
            splashBackgroundColor: '#f7f7f7'
          }
        }
      }
    : null;

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

        {isFrameV2 ? (
          <meta property="fc:frame" content={JSON.stringify(frame)} />
        ) : (
          <>
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
                <meta property="fc:frame:button:2:target" content={launchFrameLink} />
              </>
            ) : (
              <>
                <meta property="fc:frame:button:1" content="Receipt" />
                <meta property="fc:frame:button:1:action" content="link" />
                <meta property="fc:frame:button:1:target" content={receiptUrl || ''} />
              </>
            )}
          </>
        )}
      </head>
    </>
  );
}
