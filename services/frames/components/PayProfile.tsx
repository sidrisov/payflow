/* eslint-disable jsx-a11y/alt-text */
import { PaymentType } from '../types/PaymentType';
import { IdentityType } from '../types/ProfleType';
import { shortenWalletAddressLabel } from '../utils/address';
import { assetImageSrc } from '../utils/image';
import getNetworkImageSrc, { getNetworkDisplayName } from '../utils/networks';
import { ERC20_CONTRACTS } from '../utils/erc20contracts';
import { formatNumberWithSuffix } from '../utils/format';

type PaymentStep = 'create' | 'start' | 'command' | 'confirm' | 'execute';

export const payProfileHtml = (
  identity: IdentityType,
  step: PaymentStep,
  payment: PaymentType,
  entryTitle?: string
) => <PayProfile identity={identity} step={step} payment={payment} entryTitle={entryTitle} />;

const paymentStepTitle = (step: PaymentStep, entryTitle?: string) => {
  switch (step) {
    case 'create':
      return '`Your payment title`';
    case 'start':
      return entryTitle ?? '👋🏻 Pay Me';
    case 'command':
      return 'Enter payment token details';
    case 'confirm':
      return 'Pay';
    case 'execute':
      return 'Payment details';
  }
};

function PayProfile({
  identity,
  step,
  payment,
  entryTitle
}: {
  identity: IdentityType;
  step: PaymentStep;
  payment: PaymentType;
  entryTitle?: string;
}) {
  const title = paymentStepTitle(step, entryTitle);
  const tokenImgSrc =
    payment.token &&
    (ERC20_CONTRACTS.find((t) => t.chainId === payment.chainId && t.id === payment.token)
      ?.imageURL ??
      assetImageSrc(`/assets/coins/${payment.token}.png`));

  const farcasterSocial = identity?.meta?.socials?.find((s) => s.dappName === 'farcaster');
  const profileDisplayName = identity?.profile?.displayName ?? farcasterSocial?.profileDisplayName;
  const profileUsername = identity?.profile?.username ?? farcasterSocial?.profileName;
  const profileImage = identity?.profile?.profileImage ?? farcasterSocial?.profileImage;

  const isPaymentInitiated = step !== 'create' && step !== 'start' && step !== 'command';
  const maxNameWidth = isPaymentInitiated ? 450 : 600;

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#f8fafc',
        fontFamily: 'Roboto',
        fontSize: 28,
        padding: 16
      }}>
      <p style={{ fontSize: 60, fontWeight: 'bold', fontStyle: 'italic' }}>{title}</p>
      <div
        style={{
          marginTop: 30,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
        {profileImage && (
          <img
            src={profileImage}
            alt="profile"
            style={{ height: 250, width: 250, margin: 10, borderRadius: 25 }}
          />
        )}
        {profileUsername && profileDisplayName ? (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: maxNameWidth
              }}>
              {profileDisplayName}
            </span>
            <span
              style={{
                marginTop: 10,
                fontSize: 64,
                fontWeight: 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: maxNameWidth
              }}>
              @{profileUsername}
            </span>
          </div>
        ) : (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
              {shortenWalletAddressLabel(identity?.address)}
            </span>
          </div>
        )}
        {isPaymentInitiated && (
          <div
            style={{
              margin: 10,
              minWidth: 250,
              maxWidth: 300,
              height: 230,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: 16,
              fontSize: 36,
              backgroundColor: '#e0e0e0',
              borderRadius: 25,
              gap: 10
            }}>
            {payment.chainId && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10
                }}>
                <img
                  src={assetImageSrc(getNetworkImageSrc(payment.chainId as number))}
                  style={{ width: 36, height: 36, borderRadius: '50%' }}
                />
                <span style={{ fontWeight: 'bold' }}>{getNetworkDisplayName(payment.chainId)}</span>
              </div>
            )}
            {payment.token && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10
                }}>
                <img src={tokenImgSrc} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <b>{payment.token}</b>
                </span>
              </div>
            )}
            {payment.usdAmount && payment.tokenAmount && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <span>
                  <b>${payment.usdAmount} ≈ </b>
                </span>
                <span>
                  <b>{formatNumberWithSuffix(payment.tokenAmount)}</b>
                </span>
              </div>
            )}
            <span>
              <b>
                {payment.status
                  ? payment.status === 'success'
                    ? '✅ Success'
                    : '❌ Failed'
                  : '⏳ Pending'}
              </b>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
