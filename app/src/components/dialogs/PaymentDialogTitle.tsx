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
  closeStateCallback,
  ...props
}: {
  title: string;
} & CloseCallbackType &
  DialogTitleProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <DialogTitle {...props}>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent={isMobile ? 'flex-start' : 'center'}>
        {isMobile && (
          <IconButton onClick={closeStateCallback}>
            <ArrowBack />
          </IconButton>
        )}
        <Typography ml={isMobile ? 2 : 0} variant="h6">
          {title}
        </Typography>
      </Box>
    </DialogTitle>
  );
}
