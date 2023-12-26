import { ToastContainer } from 'react-toastify';

export default function CustomToastContainer() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      limit={5}
      newestOnTop={true}
      theme="colored"
      style={{ minWidth: 375 }}
      toastStyle={{
        borderRadius: 20,
        textAlign: 'center'
      }}
    />
  );
}
