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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
        <p style={{ fontSize: 64, fontWeight: 'bold' }}>You're invited to Payflow</p>
        <p style={{ fontSize: 64 }}>Proceed to Sign Up</p>
      </div>
    </div>
  );
}
