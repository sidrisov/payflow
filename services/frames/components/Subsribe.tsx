/* eslint-disable jsx-a11y/alt-text */
import { Chain } from 'viem';
import { assetImageSrc } from '../utils/image';
import getNetworkImageSrc from '../utils/networks';
import { tokens as ERC20_CONTRACTS } from '@payflow/common';
import Card from './Card';

export const buyHypersubEntryHtml = (chains: Chain[], tokens: string[]) => (
  <BuyHypersub chains={chains} tokens={tokens} />
);

function BuyHypersub({ chains, tokens }: { chains: Chain[]; tokens: string[] }) {
  const title = 'Buy Hypersub Subscription';

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <img
          src={assetImageSrc('/assets/apps/fabric.png')}
          alt="Buy Fan Tokens"
          style={{
            width: 60,
            height: 60,
            marginRight: 20,
            objectFit: 'contain'
          }}
        />
        <p style={{ fontSize: 60, fontWeight: 'bold' }}>{title}</p>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: 275
        }}>
        <div
          style={{
            width: 375,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 15
          }}>
          {chains.map((chain, index) => {
            const chainImg = assetImageSrc(getNetworkImageSrc(chain.id));

            return (
              <div
                key={chain.id}
                style={{
                  width: 70,
                  height: 70,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <img
                  src={chainImg}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%'
                  }}
                  alt="Supported Chain"
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            width: 425,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}>
          {tokens.map((token, index) => {
            const tokenImgSrc =
              ERC20_CONTRACTS.find((t) => t.id === token)?.imageURL ??
              assetImageSrc(`/assets/coins/${token}.png`);

            return (
              <div
                key={token}
                style={{
                  width: 60,
                  height: 60,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <img
                  src={tokenImgSrc}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%'
                  }}
                  alt="Supported Token"
                />
              </div>
            );
          })}
        </div>
      </div>
      <p style={{ marginTop: 10, fontSize: 35, fontWeight: 'bold' }}>with 30+ tokens cross-chain</p>
    </Card>
  );
}
