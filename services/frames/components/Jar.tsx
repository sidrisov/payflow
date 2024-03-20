/* eslint-disable jsx-a11y/alt-text */
import { JarType } from '../types/FlowType';

import Card from './Card';

export const jarHtml = (jar: JarType, balance: string) => <Jar jar={jar} balance={balance} />;

function Jar({ jar, balance }: { jar: JarType; balance: string }) {
  const profile = jar.profile;
  const flow = jar.flow;
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: 150,
          width: '100%',
          padding: 16,
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
            maxWidth: '90%'
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
          color: '#4caf50',
          padding: 5,
          border: '2px',
          borderRadius: 15
        }}>
        ${balance}
      </span>
      <div
        style={{
          margin: 10,
          padding: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          maxHeight: '50%'
        }}>
        <span
          style={{
            fontSize: 24,
            width: '50%',
            maxHeight: '100%',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden'
          }}>
          {jar.description}
        </span>
        <img
          src={jar.image}
          alt="jar"
          style={{ width: '50%', maxHeight: '100%', borderRadius: 10 }}
        />
      </div>
    </Card>
  );
}
