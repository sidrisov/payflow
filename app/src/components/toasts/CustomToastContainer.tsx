import { ToastContainer } from 'react-toastify';

export default function CustomToastContainer() {
  return (
    <ToastContainer
      position="top-center"
      hideProgressBar
      autoClose={1000}
      limit={3}
      newestOnTop={true}
      theme="colored"
      closeButton={false}
      toastStyle={{
        minHeight: 30,
        borderRadius: 15
      }}
      bodyStyle={{
        textAlign: 'center',
        whiteSpace: 'nowrap'
      }}
      style={{
        minWidth: 200,
        maxWidth: 375,
        width: 'auto',
        left: '50%',
        transform: 'translateX(-50%)'
      }}
    />
  );
}
