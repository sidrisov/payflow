/* eslint-disable jsx-a11y/alt-text */
import { PaymentType } from '../types/PaymentType';
import { ProfileType } from '../types/ProfleType';
import { shortenWalletAddressLabel } from '../utils/address';
import { assetImageSrc } from '../utils/image';
import { base } from 'viem/chains';
import getNetworkImageSrc, { getNetworkDisplayName } from '../utils/networks';
import { ERC20_CONTRACTS } from '../utils/erc20contracts';

export const payProfileHtml = (
  profile: ProfileType,
  step: 'start' | 'amount' | 'confirm' | 'execute',
  payment: PaymentType
) => <PayProfile profile={profile} step={step} payment={payment} />;

const paymentStepTitle = (step: 'start' | 'amount' | 'confirm' | 'execute') => {
  switch (step) {
    case 'start':
      return 'How you wanna pay?';
    case 'amount':
      return 'Choose payment amount?';
    case 'confirm':
      return 'Pay now or submit intent?';
    case 'execute':
      return 'Payment details';
  }
};

function PayProfile({
  profile,
  step,
  payment
}: {
  profile: ProfileType;
  step: 'start' | 'amount' | 'confirm' | 'execute';
  payment: PaymentType;
}) {
  const title = paymentStepTitle(step);
  const tokenImgSrc =
    payment.token &&
    (ERC20_CONTRACTS.find((t) => t.chainId === payment.chainId && t.id === payment.token)
      ?.imageURL ??
      assetImageSrc(`/assets/coins/${payment.token}.png`));

  console.log('comparing: ', payment.chainId, base.id, payment.chainId === base.id);

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
        {profile.profileImage && (
          <img
            src={profile.profileImage}
            alt="profile"
            style={{ height: 250, width: 250, margin: 10, borderRadius: 25 }}
          />
        )}
        {profile.username ? (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 64, fontWeight: 'bold' }}>{profile.displayName}</span>
            <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
              @{profile.username}
            </span>
          </div>
        ) : (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
              {shortenWalletAddressLabel(profile.identity)}
            </span>
          </div>
        )}
        {step !== 'start' && (
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
                  <b>{payment.tokenAmount}</b>
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
