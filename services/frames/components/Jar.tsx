/* eslint-disable jsx-a11y/alt-text */
import { JarType } from '../types/FlowType';
import { PaymentType } from '../types/PaymentType';
import { assetImageSrc } from '../utils/image';
import getNetworkImageSrc, { getNetworkDisplayName } from '../utils/networks';

import Card from './Card';

export const jarHtml = (
  jar: JarType,
  balance: string,
  step?: 'start' | 'chain' | 'amount' | 'confirm' | 'execute',
  state?: PaymentType
) => <Jar jar={jar} balance={balance} step={step} state={state} />;

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
  state
}: {
  jar: JarType;
  balance: string;
  step?: 'start' | 'chain' | 'amount' | 'confirm' | 'execute';
  state?: PaymentType;
}) {
  const profile = jar.profile;
  const flow = jar.flow;

  const title = step && contributionStepTitle(step);

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

      {step && state ? (
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
              {state.chainId && (
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
                      src={assetImageSrc(getNetworkImageSrc(state.chainId))}
                      style={{ width: 36, height: 36, borderRadius: '50%' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>
                      {getNetworkDisplayName(state.chainId)}
                    </span>
                  </div>
                </div>
              )}
              {state.token && (
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
                      src={assetImageSrc(`/assets/coins/${state.token}.png`)}
                      style={{ width: 36, height: 36, borderRadius: '50%' }}
                    />
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      <b>{state.token}</b>
                    </span>
                  </div>
                </div>
              )}
              {state.usdAmount && state.amount && (
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
                      <b>${state.usdAmount} ≈ </b>
                    </span>
                    <span>
                      <b>{state.amount}</b>
                    </span>
                  </div>
                </div>
              )}
              {state.status && (
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
                    <b>{state.status === 'success' ? '✅ Success' : '❌ Failed'}</b>
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
