import { assetImageSrc } from '../utils/image';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundSize: '100% 100%',
        backgroundColor: '#00000',
        padding: 8
      }}>
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#f8fafc',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap',
          fontFamily: 'Roboto',
          fontSize: 28,
          padding: 16,
          gap: 10,
          borderRadius: 12
        }}>
        {children}
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e0e0e0',
            borderRadius: 25,
            padding: 8
          }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5
            }}>
            <img
              src={assetImageSrc('/assets/payflow.png')}
              alt="profile"
              style={{ height: 28, width: 28, borderRadius: '50%' }}
            />
            <span style={{ fontSize: 24, fontWeight: 'bold' }}>Payflow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
