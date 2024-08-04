import React, { ReactNode } from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DialogContent, DialogTitle } from '@mui/material';

interface ResponsiveDialogProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  title: string;
  width?: number;
  height?: number;
  children: ReactNode;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onOpen,
  onClose,
  title,
  width = 360,
  height,
  children
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableSwipeToOpen={true}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height
        }
      }}
      ModalProps={{
        keepMounted: false,
        sx: { zIndex: 1500, backdropFilter: 'blur(5px)' }
      }}>
      <Box px={2} pb={3}>
        <DialogTitle variant="h6" textAlign="center">
          {title}
        </DialogTitle>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between">
          {children}
        </Box>
      </Box>
    </SwipeableDrawer>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width,
          height,
          borderRadius: 5
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle variant="h6" textAlign="center">
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 2, pt: 3 }}>{children}</DialogContent>
    </Dialog>
  );
};

export default ResponsiveDialog;
