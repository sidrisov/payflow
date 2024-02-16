export const notInvitedHtml = () => <NotInvited />;

function NotInvited() {
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
        <p style={{ fontSize: 64, fontWeight: 'bold' }}>You're not invited to Payflow</p>
        <p style={{ fontSize: 64 }}>Ask Payflow user for invite</p>
      </div>
    </div>
  );
}
