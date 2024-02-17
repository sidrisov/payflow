import { ProfileType } from '../types/ProfleType';
import fs from 'node:fs';
import { join } from 'node:path';

export const giftHtml = (gifter: ProfileType, gifted?: ProfileType) => (
  <Gift gifter={gifter} gifted={gifted} />
);

const base64EncodedContactsImage = fs.readFileSync(
  join(process.cwd(), '/assets/app-portrait-contacts.png'),
  {
    encoding: 'base64'
  }
);

function Gift({ gifter, gifted }: { gifter: ProfileType; gifted?: ProfileType }) {
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
            marginTop: 50,
            display: 'flex',
            flexDirection: 'column',
            height: '95%',
            width: 600
          }}>
          <p style={{ fontSize: 64, fontWeight: 'bold' }}>Gift your friend</p>
          <p style={{ marginTop: 30, fontSize: 32, whiteSpace: 'pre-wrap' }}>
            When you spin a gift, one of your Payflow contacts will receive $1 in ETH, USDC, or DEGEN
          </p>
          {gifted && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: 150
              }}>
              <p style={{ fontSize: 32, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                Congratulations{', '}
                <br />
                <u>
                  <b>{gifter.displayName}</b>
                </u>
              </p>
              <p style={{ fontSize: 32, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                You spinned a gift to{' '}
                <u>
                  <b>{gifted.displayName}</b>
                </u>
              </p>
              <p style={{ fontSize: 24, whiteSpace: 'pre-wrap' }}>
                The gift will be sent out within 24h
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
