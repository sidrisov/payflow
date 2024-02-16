const test = (text: string) => <Test text={text} />;

function Test({ text }: { text: string }) {
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
        fontSize: '32px',
        fontWeight: '600'
      }}>
      <div
        style={{
          fontSize: '70px',
          marginTop: '38px',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <span>
          Welcome to
          <span style={{ marginLeft: '15ch', color: 'rgb(255,93,1)' }}>{text} | Frames</span>
        </span>
      </div>
    </div>
  );
}

export { test, Test };
