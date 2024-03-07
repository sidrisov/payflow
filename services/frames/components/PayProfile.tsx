/* eslint-disable jsx-a11y/alt-text */
import { PaymentType } from '../types/PaymentType';
import { ProfileType } from '../types/ProfleType';
import { assetImageSrc } from '../utils/image';

export const payProfileHtml = (
  profile: ProfileType,
  step: 'start' | 'token' | 'amount' | 'confirm' | 'execute',
  payment: PaymentType
) => <PayProfile profile={profile} step={step} payment={payment} />;

const paymentStepTitle = (step: 'start' | 'token' | 'amount' | 'confirm' | 'execute') => {
  switch (step) {
    case 'start':
      return 'How you wanna pay the profile?';
    case 'token':
      return 'Choose payment token?';
    case 'amount':
      return 'Choose payment amount?';
    case 'confirm':
      return 'Do you wanna pay now or later (app)?';
    case 'execute':
      return 'Payment execution';
  }
};

function PayProfile({
  profile,
  step,
  payment
}: {
  profile: ProfileType;
  step: 'start' | 'token' | 'amount' | 'confirm' | 'execute';
  payment: PaymentType;
}) {
  const title = paymentStepTitle(step);

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
        <img
          src={profile.profileImage}
          alt="profile"
          style={{ height: 250, width: 250, margin: 10, borderRadius: 25 }}
        />
        <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 64, fontWeight: 'bold' }}>{profile.displayName}</span>
          <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
            @{profile.username}
          </span>
        </div>
        {step !== 'start' && (
          <div
            style={{
              margin: 10,
              width: 400,
              height: 230,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'center',
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
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  whiteSpace: 'nowrap'
                }}>
                <span>Chain</span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10
                  }}>
                  <img
                    src={assetImageSrc(`/assets/chains/base.png`)}
                    style={{ width: 36, height: 36, borderRadius: '50%' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Base</span>
                </div>
              </div>
            )}
            {payment.token && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  whiteSpace: 'nowrap'
                }}>
                <span>Token</span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10
                  }}>
                  <img
                    src={assetImageSrc(`/assets/coins/${payment.token}.png`)}
                    style={{ width: 36, height: 36, borderRadius: '50%' }}
                  />
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    <b>{payment.token}</b>
                  </span>
                </div>
              </div>
            )}
            {payment.usdAmount && payment.amount && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  whiteSpace: 'nowrap'
                }}>
                <span>Amount</span>
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
                    <b>{payment.amount}</b>
                  </span>
                </div>
              </div>
            )}
            {payment.status && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  whiteSpace: 'nowrap'
                }}>
                <span>Tx status</span>
                <span>
                  <b>{payment.status === 'success' ? '✅ Success' : '❌ Failed'}</b>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
