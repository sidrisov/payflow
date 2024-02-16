import { ProfileType } from '../types/ProfleType';

export const profileHtml = (profile: ProfileType) => <Profile profile={profile} />;

function Profile({ profile }: { profile: ProfileType }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
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
          <p style={{ fontSize: 64, fontWeight: 'bolder' }}>{profile.displayName}</p>
          <p style={{ marginTop: 10, fontSize: 64 }}>@{profile.username}</p>
        </div>
      </div>
    </div>
  );
}
