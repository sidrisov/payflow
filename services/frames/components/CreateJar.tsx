export const createJarHtml = () => <CreateJar />;

function CreateJar() {
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
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
        <p style={{ fontSize: 64, fontWeight: 'bold' }}>🫙 Enter contribution jar title?</p>
        <p style={{ fontSize: 64 }}>other details pulled from cast</p>
      </div>
    </div>
  );
}
