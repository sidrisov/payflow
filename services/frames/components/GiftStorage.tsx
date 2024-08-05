/* eslint-disable jsx-a11y/alt-text */
import { IdentityType } from '../types/ProfleType';
import { StorageUsage } from '../types/StorageUsageType';
import { shortenWalletAddressLabel } from '../utils/address';
import { formatNumberWithSuffix } from '../utils/format';

export const giftStorageHtml = (identity: IdentityType, storage: StorageUsage) => (
  <GiftStorage identity={identity} storage={storage} />
);

function GiftStorage({ identity, storage }: { identity: IdentityType; storage: StorageUsage }) {
  const title = '🎁 Gift Storage';

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <span>
              <b>Has {storage.total_active_units} Units</b>
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
                📝 {formatNumberWithSuffix(storage.casts.used.toString())}/
                {formatNumberWithSuffix(storage.casts.capacity.toString())}
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
                👍 {formatNumberWithSuffix(storage.reactions.used.toString())}/
                {formatNumberWithSuffix(storage.reactions.capacity.toString())}
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
                👥 {formatNumberWithSuffix(storage.links.used.toString())}/
                {formatNumberWithSuffix(storage.links.capacity.toString())}
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
