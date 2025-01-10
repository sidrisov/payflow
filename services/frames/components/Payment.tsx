/* eslint-disable jsx-a11y/alt-text */
import { IdentityType } from '../types/ProfleType';
import { shortenWalletAddressLabel } from '../utils/address';
import { assetImageSrc } from '../utils/image';
import getNetworkImageSrc, { getNetworkDisplayName } from '../utils/networks';
import { tokens as ERC20_CONTRACTS, PaymentType } from '@payflow/common';
import { formatNumberWithSuffix } from '../utils/format';
import Card from './Card';

export const paymentHtml = (
  identity: IdentityType,
  payment: PaymentType,
  title?: string,
  theme?: string
) => <Payment identity={identity} payment={payment} title={title} theme={theme} />;

const paymentTitle = (payment: PaymentType, title?: string) => {
  return (
    payment.name ||
    title ||
    (payment.referenceId
      ? payment.status === 'CREATED' && payment.type !== 'SESSION_INTENT'
        ? 'Complete payment'
        : 'Payment'
      : '👋 Pay Me')
  );
};

const paymentStatus = (payment: PaymentType) => {
  switch (payment.status) {
    case 'CREATED':
      return payment.type === 'SESSION_INTENT' ? '🔄 Processing' : '⏳ Pending';
    case 'COMPLETED':
      return '✅ Success';
    case 'FAILED':
      return '🚫 Failed';
    case 'EXPIRED':
      return '⏱ Expired';
    case 'CANCELLED':
      return '🔴 Cancelled';
    case 'PENDING_REFUND':
      return '↪️ Refunding';
    case 'REFUNDED':
      return '↪️ Refunded';
    case 'INPROGRESS':
      return '🔄 Processing';
  }
};

function Payment({
  identity,
  payment,
  title: entryTitle,
  theme
}: {
  identity: IdentityType;
  payment: PaymentType;
  title?: string;
  theme?: string;
}) {
  const title = paymentTitle(payment, entryTitle);
  const status = paymentStatus(payment);
  const tokenImgSrc =
    payment.token &&
    (ERC20_CONTRACTS.find((t) => t.chainId === payment.chainId && t.id === payment.token)
      ?.imageURL ??
      assetImageSrc(`/assets/coins/${payment.token}.png`));

  const farcasterSocial = identity?.meta?.socials?.find((s) => s.dappName === 'farcaster');
  const profileDisplayName = identity?.profile?.displayName ?? farcasterSocial?.profileDisplayName;
  const profileUsername = identity?.profile?.username ?? farcasterSocial?.profileName;
  const profileImage = identity?.profile?.profileImage ?? farcasterSocial?.profileImage;

  const isPaymentInitiated = payment.referenceId;
  const showPreferredTokens = false; /* 
    (step === 'start' || step === 'command') &&
    identity.profile?.preferredTokens &&
    identity.profile.preferredTokens.length > 0; */
  const maxNameWidth = isPaymentInitiated || showPreferredTokens ? 450 : 600;

  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#2d2d2d' : '#e0e0e0';
  const textColor = isDark ? '#ffffff' : '#000000';

  return (
    <Card theme={theme}>
      <p style={{ fontSize: 60, fontWeight: 'bold', fontStyle: 'italic', color: textColor }}>
        {title}
      </p>
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
        {profileImage && (
          <img
            src={profileImage}
            alt="profile"
            style={{ height: 240, width: 240, margin: 10, borderRadius: '50%' }}
          />
        )}
        {profileUsername && profileDisplayName ? (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 60,
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
                fontSize: 60,
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
              backgroundColor,
              borderRadius: 30,
              gap: 10,
              color: textColor
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
            {payment.usdAmount !== undefined && payment.tokenAmount !== undefined && (
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
                  <b>{formatNumberWithSuffix(payment.tokenAmount.toString())}</b>
                </span>
              </div>
            )}
            <span>
              <b>{status}</b>
            </span>
          </div>
        )}
        {showPreferredTokens && (
          <div
            style={{
              margin: 10,
              maxWidth: 300,
              minHeight: 200,
              maxHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: 16,
              fontSize: 36,
              backgroundColor,
              borderRadius: '16px',
              gap: 5,
              color: textColor
            }}>
            <span style={{ textAlign: 'center', fontSize: 30, fontWeight: 'bold' }}>Preferred</span>
            {identity.profile?.preferredTokens?.slice(0, 5).map((tokenId) => {
              const token = ERC20_CONTRACTS.find((t) => t.id === tokenId);
              const tokenImgSrc = token?.imageURL ?? assetImageSrc(`/assets/coins/${tokenId}.png`);
              return (
                <div
                  key={`preferred_token_${tokenId}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10
                  }}>
                  <img src={tokenImgSrc} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  <span style={{ fontSize: 28, textTransform: 'uppercase' }}>{tokenId}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
