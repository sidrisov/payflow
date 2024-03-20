export default function Card({ children }: { children: React.ReactNode }) {
  return (
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
        gap: 10
      }}>
      {children}
    </div>
  );
}
