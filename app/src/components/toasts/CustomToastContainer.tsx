import { useMediaQuery, useTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';

export default function CustomToastContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
