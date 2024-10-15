import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as DeviceDetect from 'react-device-detect';
import ResponsiveDialog from './dialogs/ResponsiveDialog';

interface DeviceInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DeviceInfoDialog: React.FC<DeviceInfoDialogProps> = ({ open, onClose }) => {
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (open) {
      const info = Object.entries(DeviceDetect)
        .filter(([_, value]) => typeof value !== 'function')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      setDeviceInfo(info);
    }
  }, [open]);

  return (
    <ResponsiveDialog open={open} onClose={onClose}>
      <DialogTitle id="device-info-dialog-title">
        Device Information
        {fullScreen && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500]
            }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          component="pre"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {deviceInfo}
        </Typography>
      </DialogContent>
    </ResponsiveDialog>
  );
};
