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
            bottom: 12,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e0e0e0',
            borderRadius: 25,
            padding: 5
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
              style={{ height: 20, width: 20, borderRadius: '50%' }}
            />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>Payflow by sinaver.eth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
