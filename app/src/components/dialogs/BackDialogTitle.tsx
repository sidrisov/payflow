import {
  Box,
  DialogTitle,
  DialogTitleProps,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { ArrowBack } from '@mui/icons-material';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
