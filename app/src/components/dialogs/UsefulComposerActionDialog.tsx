import React from 'react';
import { Dialog, DialogContent, DialogProps } from '@mui/material';
import { UsefulTabs } from '../useful/UsefulTabs';
import { useMobile } from '../../utils/hooks/useMobile';

export type UsefulComposerActionDialogProps = DialogProps;

export default function UsefulComposerActionDialog({ ...props }: UsefulComposerActionDialogProps) {
  const isMobile = useMobile();

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      {...props}
      PaperProps={{
        elevation: 5,
        sx: {
          ...(!isMobile && {
            width: 375,
            borderRadius: 5
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogContent>
        <UsefulTabs />
      </DialogContent>
    </Dialog>
  );
}
