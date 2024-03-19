/* eslint-disable jsx-a11y/alt-text */
import { JarType } from '../types/FlowType';

import Card from './Card';

export const jarHtml = (jar: JarType) => <Jar jar={jar} />;

function Jar({ jar }: { jar: JarType }) {
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
          height: 200,
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
        <img
          src={jar.image}
          alt="jar"
          style={{ width: '50%', maxHeight: '100%', borderRadius: 10 }}
        />
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
      </div>
    </Card>
  );
}
