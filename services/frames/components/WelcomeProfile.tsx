export const welcomeProfileHtml = (fname: string) => <WelcomeProfile fname={fname} />;

function WelcomeProfile({ fname }: { fname: string }) {
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
        <p style={{ fontSize: 64, fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>
          Welcome to Payflow{', '}
          <u>{fname}</u>
        </p>
        <p style={{ fontSize: 64 }}>select profile to continue</p>
      </div>
    </div>
  );
}
