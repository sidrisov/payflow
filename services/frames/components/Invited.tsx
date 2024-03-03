import fs from 'node:fs';
import { join } from 'node:path';

const base64EncodedEthDenverImage = fs.readFileSync(join(process.cwd(), '/assets/ethdenver.png'), {
  encoding: 'base64'
});

export const invitedHtml = () => <Invited />;

function Invited() {
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
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <img
          src={`data:image/png;base64,${base64EncodedEthDenverImage}`}
          alt="ethdenver"
          style={{ height: '80%' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
          <p style={{ fontSize: 72, color: '#4e58cb', fontWeight: 'bold' }}>ETHDenver 2024</p>
          <p style={{ marginTop: 50, fontSize: 54, fontWeight: 'bold' }}>
            You're invited to Payflow
          </p>
          <p style={{ fontSize: 54 }}>proceed to sign up</p>
        </div>
      </div>
    </div>
  );
}
