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
  zIndex?: number;
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
  zIndex = 1500,
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
          height,
          m: 1,
          p: 1,
          pb: 0.5
        }
      }}
      ModalProps={{
        sx: { zIndex }
      }}>
      <Puller />
      <Box>
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
      slotProps={{
        paper: {
          sx: {
            width,
            height
          }
        }
      }}
      sx={{
        zIndex
      }}>
      <DialogTitle variant="h6" textAlign="center" sx={{ pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 2 }}>{children}</DialogContent>
    </Dialog>
  );
};

export default ResponsiveDialog;
