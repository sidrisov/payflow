import { ProfileType } from '../types/ProfleType';
import fs from 'node:fs';
import { join } from 'node:path';

export const giftHtml = (gifter: ProfileType, gifted?: ProfileType, error?: string) => (
  <Gift gifter={gifter} gifted={gifted} error={error} />
);

const base64EncodedContactsImage = fs.readFileSync(
  join(process.cwd(), '/assets/app-portrait-contacts.png'),
  {
    encoding: 'base64'
  }
);

const base64EncodedGiftImage = fs.readFileSync(join(process.cwd(), '/assets/gift.png'), {
  encoding: 'base64'
});

const GiftErrorMessage = ({ error }: { error: string }) => {
  switch (error) {
    case 'GIFT_SPIN_LIMIT_REACHED':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
          <p>Your have reached 10 spin gift limit 🎉</p>
          <p>Thank you 🙏🏻</p>
        </div>
      );
    case 'NO_CONTACT_TO_GIFT':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
          <p>You spinned to all your contacts 🎉</p>
          <p>Invite more friends to Payflow to continue 💌 </p>
        </div>
      );
    case 'GIFT_CAMPAIGN_LIMIT_REACHED':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
          <p>We have reached 100 total gifts 🎉</p>
          <p>Thank you for spinning a gift 🙏🏻</p>
        </div>
      );
    default:
      return <p>Error</p>;
  }
};

function Gift({
  gifter,
  gifted,
  error
}: {
  gifter: ProfileType;
  gifted?: ProfileType;
  error?: string;
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
          <p style={{ fontSize: 60, fontWeight: 'bold' }}>Gift your friend</p>
          <p style={{ marginTop: 30, fontSize: 28, whiteSpace: 'pre-wrap' }}>
            When you spin a gift, one of your contacts on Payflow will receive $1 in ETH, USDC, or
            DEGEN
          </p>

          {gifted ? (
            <div
              style={{
                marginTop: 30,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: 150
              }}>
              <p style={{ fontSize: 28, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                Congratulations{', '}
                <br />
                <u>
                  <b>{gifter.displayName}</b>
                </u>
              </p>
              <p style={{ fontSize: 28, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                You spinned a gift to{' '}
                <u>
                  <b>{gifted.displayName}</b>
                </u>
              </p>
              <p style={{ fontSize: 24, whiteSpace: 'pre-wrap' }}>
                The gift will be sent out within 24h
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                marginTop: 30,
                fontSize: 24,
                color: 'green',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: 100
              }}>
              <GiftErrorMessage error={error} />
            </div>
          ) : (
            <img
              src={`data:image/png;base64,${base64EncodedGiftImage}`}
              alt="profile"
              style={{ width: 200, height: 200 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
