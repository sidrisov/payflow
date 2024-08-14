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
        {/* <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}>
          <img src={assetImageSrc(`/assets/payflow.png`)} alt="Logo" height="50" />
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>
            <b>payflow</b> by <b>@sinaver.eth</b>
          </span>
        </div> */}
      </div>
    </div>
  );
}
