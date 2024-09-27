import { Box, DialogTitle, DialogTitleProps, IconButton, Typography } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { ArrowBack } from '@mui/icons-material';
import { useMobile } from '../../utils/hooks/useMobile';

export function BackDialogTitle({
  title,
  hidden = false,
  showOnDesktop = false,
  closeStateCallback,
  ...props
}: {
  title: string;
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
        flexDirection="row"
        alignItems="center"
        justifyContent={showBackButton ? 'flex-start' : 'center'}>
        {showBackButton && (
          <IconButton onClick={closeStateCallback}>
            <ArrowBack />
          </IconButton>
        )}
        <Typography ml={showBackButton ? 2 : 0} variant="h6">
          {title}
        </Typography>
      </Box>
    </DialogTitle>
  );
}
