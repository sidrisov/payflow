/* eslint-disable jsx-a11y/alt-text */
import { JarType } from '../types/FlowType';
import { PaymentType } from '../types/PaymentType';
import { ERC20_CONTRACTS } from '../utils/erc20contracts';
import { assetImageSrc } from '../utils/image';
import getNetworkImageSrc, { getNetworkDisplayName } from '../utils/networks';

import Card from './Card';

export const jarHtml = (
  jar: JarType,
  balance: string,
  step?: 'start' | 'chain' | 'amount' | 'confirm' | 'execute',
  payment?: PaymentType
) => <Jar jar={jar} balance={balance} step={step} payment={payment} />;

const contributionStepTitle = (step: 'start' | 'chain' | 'amount' | 'confirm' | 'execute') => {
  switch (step) {
    case 'start':
      return 'How you wanna contribute?';
    case 'chain':
      return '🔗 Choose chain';
    case 'amount':
      return '💜 Enter your contribution';
    case 'confirm':
      return 'Contribute now or later (app)?';
    case 'execute':
      return 'Contribution result';
  }
};

function Jar({
  jar,
  balance,
  step,
  payment
}: {
  jar: JarType;
  balance: string;
  step?: 'start' | 'chain' | 'amount' | 'confirm' | 'execute';
  payment?: PaymentType;
}) {
  const profile = jar.profile;
  const flow = jar.flow;

  const title = step && contributionStepTitle(step);
  const tokenImgSrc =
    payment?.token &&
    (ERC20_CONTRACTS.find((t) => t.chainId === payment.chainId && t.id === payment.token)
      ?.imageURL ??
      assetImageSrc(`/assets/coins/${payment.token}.png`));

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 150,
          width: '100%',
          padding: 16,
          gap: 10
        }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '80%',
            gap: 10
          }}>
          <img
            src={jar.profile.profileImage}
            alt="profile"
            style={{ height: 120, borderRadius: 100 }}
          />

          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: 5,
              maxWidth: '80%'
            }}>
            <span
              style={{
                fontSize: 40,
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
              {flow.title}
            </span>
            <span style={{ whiteSpace: 'pre-wrap' }}>
              by {profile.displayName}
              <b> @{profile.username}</b>
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '54',
            fontWeight: 'bold',
            padding: 10,
            border: '3px',
            borderRadius: 25
          }}>
          ${balance}
        </span>
      </div>

      {step && payment ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 10
          }}>
          <p style={{ fontSize: 36, fontWeight: 'bold' }}>{title}</p>
          {step !== 'start' && (
            <div
              style={{
                margin: 10,
                width: 400,
                height: 230,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'stretch',
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
                      src={assetImageSrc(getNetworkImageSrc(payment.chainId))}
                      style={{ width: 36, height: 36, borderRadius: '50%' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>
                      {getNetworkDisplayName(payment.chainId)}
                    </span>
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
                    <img src={tokenImgSrc} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      <b>{payment.token}</b>
                    </span>
                  </div>
                </div>
              )}
              {payment.usdAmount && payment.tokenAmount && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    gap: 5
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
                      <b>{payment.tokenAmount}</b>
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
      ) : (
        <div
          style={{
            margin: 30,
            padding: 16,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 30,
            height: '65%'
          }}>
          <span
            style={{
              padding: 5,
              fontSize: 28,
              width: '50%',
              maxHeight: '100%',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}>
            {jar.description}
          </span>

          {jar.image && (
            <img
              src={jar.image}
              alt="jar"
              style={{ height: '100%', maxWidth: '50%', borderRadius: 10 }}
            />
          )}
        </div>
      )}
    </Card>
  );
}
