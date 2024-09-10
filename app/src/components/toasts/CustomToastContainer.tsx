import { ToastContainer } from 'react-toastify';
import { useMobile } from '../../utils/hooks/useMobile';

export default function CustomToastContainer() {
  const isMobile = useMobile();

  return (
    <ToastContainer
      position={isMobile ? 'top-center' : 'top-right'}
      hideProgressBar
      autoClose={1000}
      limit={3}
      newestOnTop={true}
      theme="colored"
      closeButton={false}
      toastStyle={{
        marginTop: 10,
        minHeight: 30,
        borderRadius: 15
      }}
      bodyStyle={{
        textAlign: 'center',
        textWrap: 'wrap',
        whiteSpace: 'nowrap'
      }}
      style={{
        minWidth: 200,
        maxWidth: 375,
        width: 'auto',
        ...(isMobile && { left: '50%', transform: 'translateX(-50%)' })
      }}
    />
  );
}
