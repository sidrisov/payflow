/* eslint-disable jsx-a11y/alt-text */
import { Chain } from 'viem';
import { IdentityType } from '../types/ProfleType';
import { StorageUsage } from '../types/StorageUsageType';
import { shortenWalletAddressLabel } from '../utils/address';
import { formatNumberWithSuffix } from '../utils/format';
import { assetImageSrc } from '../utils/image';
import getNetworkImageSrc from '../utils/networks';
import { ERC20_CONTRACTS } from '../utils/erc20contracts';
import Card from './Card';

export const buyStorageEntryHtml = (chains: Chain[], tokens: string[]) => (
  <BuyStorageEntry chains={chains} tokens={tokens} />
);

export const buyStorageHtml = (identity: IdentityType, storage: StorageUsage) => (
  <BuyStorage identity={identity} storage={storage} />
);

function BuyStorageEntry({ chains, tokens }: { chains: Chain[]; tokens: string[] }) {
  const title = 'Buy Storage';

  return (
    <Card>
      <p style={{ fontSize: 60, fontWeight: 'bold' }}>{title}</p>
      <div
        style={{
          marginTop: 20,
          padding: 16,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: 300,
          gap: 30
        }}>
        <div
          style={{
            padding: 16,
            width: 375,
            maxHeight: 275,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
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
            padding: 16,
            width: 425,
            maxHeight: 275,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 5
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
      <p style={{ fontSize: 35, fontWeight: 'bold' }}>with 20+ tokens across multiple l2 chains</p>
    </Card>
  );
}

function BuyStorage({ identity, storage }: { identity: IdentityType; storage: StorageUsage }) {
  const title = 'Buy Storage';

  const farcasterSocial = identity?.meta?.socials?.find((s) => s.dappName === 'farcaster');
  const profileDisplayName = identity?.profile?.displayName ?? farcasterSocial?.profileDisplayName;
  const profileUsername = identity?.profile?.username ?? farcasterSocial?.profileName;
  const profileImage = identity?.profile?.profileImage ?? farcasterSocial?.profileImage;
  const maxNameWidth = 450;

  return (
    <Card>
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

        <div
          style={{
            margin: 10,
            minWidth: 250,
            maxWidth: 300,
            minHeight: 230,
            maxHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            padding: 16,
            fontSize: 36,
            backgroundColor: '#e0e0e0',
            borderRadius: '16px',
            gap: 10
          }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <span>
              <b>{storage.total_active_units} Active Units</b>
            </span>
          </div>
          {storage.soon_expire_units !== 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <span style={{ color: 'red' }}>
                <b>{storage.soon_expire_units} Expiring Units</b>
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <span>
              <b>
                📝
                <span
                  style={{
                    color: storage.casts.used > storage.casts.capacity ? 'red' : 'inherit',
                    paddingLeft: '4px'
                  }}>
                  {formatNumberWithSuffix(storage.casts.used.toString())}
                </span>
                /{formatNumberWithSuffix(storage.casts.capacity.toString())}
              </b>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <span>
              <b>
                👍{' '}
                <span
                  style={{
                    color: storage.reactions.used > storage.reactions.capacity ? 'red' : 'inherit',
                    paddingLeft: '4px'
                  }}>
                  {formatNumberWithSuffix(storage.reactions.used.toString())}
                </span>
                /{formatNumberWithSuffix(storage.reactions.capacity.toString())}
              </b>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <span>
              <b>
                👥{' '}
                <span
                  style={{
                    color: storage.links.used > storage.links.capacity ? 'red' : 'inherit',
                    paddingLeft: '4px'
                  }}>
                  {formatNumberWithSuffix(storage.links.used.toString())}
                </span>
                /{formatNumberWithSuffix(storage.links.capacity.toString())}
              </b>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
