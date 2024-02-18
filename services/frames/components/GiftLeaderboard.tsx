import { ProfileType } from '../types/ProfleType';
import fs from 'node:fs';
import { join } from 'node:path';
import { GiftProfileType } from '../types/GiftType';

export const giftLeaderboardHtml = (profile: ProfileType, leaderboard: GiftProfileType[]) => (
  <GiftLeaderboard profile={profile} leaderboard={leaderboard} />
);

const base64EncodedContactsImage = fs.readFileSync(
  join(process.cwd(), '/assets/app-portrait-contacts.png'),
  {
    encoding: 'base64'
  }
);

function GiftLeaderboard({
  profile,
  leaderboard
}: {
  profile: ProfileType;
  leaderboard: GiftProfileType[];
}) {
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
        <img
          src={`data:image/png;base64,${base64EncodedContactsImage}`}
          alt="contacts"
          style={{ height: '95%' }}
        />
        <div
          style={{
            marginLeft: 50,
            marginTop: 70,
            display: 'flex',
            flexDirection: 'column',
            height: '95%',
            width: 600
          }}>
          <p style={{ fontSize: 64, fontWeight: 'bold' }}>🏆 Gift Leadearboard</p>
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
                width: 350,
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
                    padding: 8,
                    height: 50,
                    width: 350,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 20
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      width: 300,
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
                  <span style={{ marginLeft: 10, fontWeight: 'bold' }}>{l.gifts.length}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 8,
                height: 50,
                width: 150,
                backgroundColor: '#e0e0e0',
                borderRadius: 20
              }}>
              <span>You</span>
              <span style={{ fontWeight: 'bold' }}>
                {leaderboard.find((l) => l.profile.identity === profile.identity)?.gifts.length ??
                  0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
