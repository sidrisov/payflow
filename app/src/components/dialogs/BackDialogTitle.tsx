import React from 'react';
import { Box, DialogTitle, DialogTitleProps, IconButton, Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { ArrowBack } from '@mui/icons-material';
import { useMobile } from '../../utils/hooks/useMobile';

export function BackDialogTitle({
  title,
  controlComponent: additionalTitleComponent,
  hidden = false,
  showOnDesktop = false,
  closeStateCallback,
  ...props
}: {
  title: string;
  controlComponent?: React.ReactNode;
  hidden?: boolean;
  showOnDesktop?: boolean;
} & CloseCallbackType &
  DialogTitleProps) {
  const isMobile = useMobile();

  const showBackButton = !hidden && (showOnDesktop || isMobile);

  return (
    <DialogTitle {...props}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems={showBackButton ? 'flex-start' : 'center'}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%">
          <Stack direction="row" alignItems="center" spacing={1}>
            {showBackButton && (
              <IconButton onClick={closeStateCallback}>
                <ArrowBack />
              </IconButton>
            )}
            <Typography ml={showBackButton ? 2 : 0} variant="h6">
              {title}
            </Typography>
          </Stack>
          {additionalTitleComponent && <Box ml={2}>{additionalTitleComponent}</Box>}
        </Box>
        {props.children && (
          <Box mt={1} width="100%">
            {props.children}
          </Box>
        )}
      </Box>
    </DialogTitle>
  );
}
