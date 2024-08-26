import { Box, Typography, Button, Stack } from '@mui/material';
import { green } from '@mui/material/colors';
import React from 'react';
import { RiSparklingFill } from 'react-icons/ri';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdateVersionPrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('SW Need Refresh');
    }
  });

  const NewVersionNotice = () => (
    <Box display="flex" alignItems="center">
      <RiSparklingFill color="inherit" fontSize="large" style={{ marginRight: 8 }} />
      <Typography variant="caption" fontWeight="bold" noWrap>
        New app version available
      </Typography>
    </Box>
  );

  const UpdateVersionButton = ({
    onClick
  }: {
    onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  }) => (
    <Button
      size="small"
      variant="contained"
      sx={{
        borderRadius: 5,
        textTransform: 'none',
        fontSize: 12,
        color: 'black',
        backgroundColor: green.A700,
        '&:hover': {
          backgroundColor: green.A400
        }
      }}
      onClick={onClick}>
      Update
    </Button>
  );

  return (
    needRefresh && (
      <Stack
        mt={1}
        width={275}
        alignSelf="center"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        border={2}
        borderRadius={5}
        p={1}
        sx={{
          borderStyle: 'dashed',
          borderColor: 'divider'
        }}>
        <NewVersionNotice />
        <UpdateVersionButton onClick={() => updateServiceWorker(true)} />
      </Stack>
    )
  );
};
