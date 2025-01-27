import { Box, Typography, Button, Stack } from '@mui/material';
import { green } from '@mui/material/colors';
import { useState, useEffect } from 'react';
import { RiSparklingFill } from 'react-icons/ri';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdateVersionPrompt = () => {
  const [needRefresh, setNeedRefresh] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    updateServiceWorker,
    needRefresh: [_needRefresh, setNeedRefreshSW]
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('SW Need Refresh');
      setNeedRefresh(true);
    }
  });

  useEffect(() => {
    setNeedRefresh(_needRefresh);
  }, [_needRefresh]);

  const handleUpdate = () => {
    setIsUpdating(true);
    updateServiceWorker(true).then(() => {
      setIsUpdating(false);
      setNeedRefresh(false);
      setNeedRefreshSW(false);
    });
  };

  if (!needRefresh) return null;

  const NewVersionNotice = () => (
    <Box display="flex" alignItems="center">
      <RiSparklingFill color="inherit" fontSize="large" style={{ marginRight: 8 }} />
      <Typography variant="caption" fontWeight="bold" noWrap>
        New app version available
      </Typography>
    </Box>
  );

  const UpdateVersionButton = () => (
    <Button
      size="small"
      variant="contained"
      disabled={isUpdating}
      sx={{
        textTransform: 'none',
        fontSize: 12,
        color: 'black',
        backgroundColor: green.A700,
        '&:hover': {
          backgroundColor: green.A400
        },
        zIndex: 1600 // always display on top
      }}
      onClick={handleUpdate}>
      {isUpdating ? 'Updating...' : 'Update'}
    </Button>
  );

  return (
    <Stack
      mt={1}
      width={350}
      alignSelf="center"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      border={2}
      borderRadius={5}
      p={1}
      sx={{
        borderStyle: 'dashed',
        borderColor: 'divider',
        zIndex: 1600
      }}>
      <NewVersionNotice />
      <UpdateVersionButton />
    </Stack>
  );
};
