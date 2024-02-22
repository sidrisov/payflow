/* eslint-disable jsx-a11y/alt-text */
import { ProfileType } from '../types/ProfleType';
import { GiftProfileType, GiftType } from '../types/GiftType';
import { assetImageSrc } from '../utils/image';

export const giftLeaderboardHtml = (profile: ProfileType, leaderboard: GiftProfileType[]) => (
  <GiftLeaderboard profile={profile} leaderboard={leaderboard} />
);

const contactImage = assetImageSrc('/assets/app-portrait-contacts.png');

const ProfileGifts = ({ gifts }: { gifts: GiftType[] }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3
      }}>
      {gifts.slice(0, 3).map((g) => (
        <GiftTokenImg token={g.token} />
      ))}
      {gifts.length > 3 && (
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>+{gifts.length - 3}</span>
      )}
    </div>
  );
};

const GiftTokenImg = ({ token }: { token: string }) => {
  return (
    <img
      src={assetImageSrc(`/assets/coins/${token}.png`)}
      style={{ width: 24, height: 24, borderRadius: '50%' }}
    />
  );
};

function GiftLeaderboard({
  profile,
  leaderboard
}: {
  profile: ProfileType;
  leaderboard: GiftProfileType[];
}) {
  const profileGifts = leaderboard.find((l) => l.profile.identity === profile.identity)?.gifts;

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
        fontFamily: 'Roboto'
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}>
        <img src={contactImage} alt="contacts" style={{ height: '95%' }} />
        <div
          style={{
            marginLeft: 50,
            marginTop: 70,
            display: 'flex',
            flexDirection: 'column',
            height: '95%',
            width: 600
          }}>
          <p style={{ fontSize: 60, fontWeight: 'bold' }}>🏆 Gift Leadearboard</p>
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              fontSize: 28,
              width: 600
            }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                width: 400,
                height: 300,
                gap: 15
              }}>
              {leaderboard.slice(0, 5).map((l, index) => (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    width: 400,
                    height: 50,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 20
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      width: 250,
                      whiteSpace: 'nowrap'
                    }}>
                    <span style={{ marginRight: 10, fontWeight: 'bold' }}>#{index + 1}</span>
                    <img
                      src={l.profile.profileImage}
                      alt="profile"
                      style={{ width: 32, height: 32, borderRadius: '50%' }}
                    />
                    <span
                      style={{
                        marginLeft: 10,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                      {l.profile.username}
                    </span>
                  </div>
                  <ProfileGifts gifts={l.gifts} />
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                height: 115,
                width: 150,
                backgroundColor: '#e0e0e0',
                borderRadius: 20
              }}>
              <span>You</span>
              {profileGifts && <ProfileGifts gifts={profileGifts} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
