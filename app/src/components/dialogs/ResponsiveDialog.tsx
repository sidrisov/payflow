import React, { ReactNode } from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { DialogContent, DialogTitle } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useMobile } from '../../utils/hooks/useMobile';

export interface ResponsiveDialogProps {
  open: boolean;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  width?: number;
  height?: number;
  children?: ReactNode;
}

const Puller = styled('div')(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.palette.mode === 'light' ? grey[400] : grey[700],
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)'
}));

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onOpen,
  onClose,
  title,
  width = 360,
  height,
  children
}) => {
  const isMobile = useMobile();

  return isMobile ? (
    <SwipeableDrawer
      disableEnforceFocus
      disableAutoFocus
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen ? onOpen : () => {}}
      disableSwipeToOpen={true}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height
        }
      }}
      ModalProps={{
        sx: { zIndex: 1500, backdropFilter: 'blur(5px)' }
      }}>
      <Puller />
      <Box p={2} pt={1} pb={3}>
        <DialogTitle variant="h6" textAlign="center" sx={{ pb: 1 }}>
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
      disableEnforceFocus
      disableAutoFocus
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
        zIndex: 1500,
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle variant="h6" textAlign="center" sx={{ pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 2 }}>{children}</DialogContent>
    </Dialog>
  );
};

export default ResponsiveDialog;
