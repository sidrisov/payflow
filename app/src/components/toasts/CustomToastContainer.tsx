import { Flip, ToastContainer } from 'react-toastify';
import { useMobile } from '../../utils/hooks/useMobile';

export default function CustomToastContainer() {
  const isMobile = useMobile();

  return (
    <ToastContainer
      position={isMobile ? 'top-center' : 'top-right'}
      hideProgressBar
      autoClose={1000}
      icon={false}
      limit={3}
      newestOnTop
      theme="colored"
      closeButton={false}
      transition={Flip}
      toastStyle={{
        width: 'auto',
        minWidth: 120,
        maxWidth: 300,
        marginTop: 10,
        minHeight: 30,
        borderRadius: '16px',
        textAlign: 'center',
        textWrap: 'balance',
        justifyContent: 'center'
      }}
    />
  );
}
