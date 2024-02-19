/* eslint-disable jsx-a11y/alt-text */
import { BalanceType } from '../types/BalanceType';
import { ProfileType } from '../types/ProfleType';

import { assetImageSrc } from '../utils/image';

export const profileHtml = (profile: ProfileType, balances?: BalanceType[]) => (
  <Profile profile={profile} balances={balances} />
);

function Profile({ profile, balances }: { profile: ProfileType; balances?: BalanceType[] }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'Roboto',
        fontSize: 28
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
        <img
          src={profile.profileImage}
          alt="profile"
          style={{ height: '80%', margin: 10, borderRadius: 25 }}
        />
        <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 64, fontWeight: 'bold' }}>{profile.displayName}</span>
          <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
            @{profile.username}
          </span>
          {balances && balances.length !== 0 && (
            <div
              style={{
                margin: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'stretch',
                backgroundColor: '#e0e0e0',
                borderRadius: 25,
                padding: 12
              }}>
              {balances.map((b) => (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 50,
                    whiteSpace: 'nowrap'
                  }}>
                  <img
                    src={assetImageSrc(`/assets/coins/${b.token}.png`)}
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>{b.balance}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
