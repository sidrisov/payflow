/* eslint-disable jsx-a11y/alt-text */
import { IdentityType } from '../types/ProfleType';
import { StorageUsage } from '../types/StorageUsageType';
import { shortenWalletAddressLabel } from '../utils/address';
import { formatNumberWithSuffix } from '../utils/format';

export const giftStorageHtml = (identity: IdentityType, storage: StorageUsage) => (
  <GiftStorage identity={identity} storage={storage} />
);

function GiftStorage({ identity, storage }: { identity: IdentityType; storage: StorageUsage }) {
  const title = 'Buy Storage';

  const farcasterSocial = identity?.meta?.socials?.find((s) => s.dappName === 'farcaster');
  const profileDisplayName = identity?.profile?.displayName ?? farcasterSocial?.profileDisplayName;
  const profileUsername = identity?.profile?.username ?? farcasterSocial?.profileName;
  const profileImage = identity?.profile?.profileImage ?? farcasterSocial?.profileImage;
  const maxNameWidth = 450;

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
            borderRadius: 25,
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

          {/* <span>
            <b>
              {payment.status
                ? payment.status === 'success'
                  ? '✅ Success'
                  : '❌ Failed'
                : '⏳ Pending'}
            </b>
          </span> */}
        </div>
      </div>
    </div>
  );
}
