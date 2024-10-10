import React from 'react';
import { Dialog, DialogContent, DialogProps, Box } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { BackDialogTitle } from '../dialogs/BackDialogTitle';
import { UpSlideTransition } from '../dialogs/TransitionDownUpSlide';
import PoweredByGlideText from '../text/PoweredByGlideText';
import { useMobile } from '../../utils/hooks/useMobile';

export type BasePaymentDialogProps = DialogProps &
  CloseCallbackType & {
    alwaysShowBackButton?: boolean;
    title?: string;
    children: React.ReactNode;
    footerContent?: React.ReactNode;
  };

export function BasePaymentDialog({
  alwaysShowBackButton = false,
  title,
  children,
  footerContent,
  closeStateCallback,
  ...props
}: BasePaymentDialogProps) {
  const isMobile = useMobile();

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      onClose={closeStateCallback}
      {...props}
      PaperProps={{
        sx: {
          ...(!isMobile && {
            width: 375,
            borderRadius: 5,
            height: 650
          })
        }
      }}
      sx={{
        zIndex: 1450,
        backdropFilter: 'blur(3px)'
      }}
      {...(isMobile && { TransitionComponent: UpSlideTransition })}>
      <BackDialogTitle
        showOnDesktop={alwaysShowBackButton}
        title={title ?? 'Payment'}
        closeStateCallback={closeStateCallback}
      />
      <DialogContent
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
        {children}
        <Box display="flex" flexDirection="column" alignItems="center" width="100%">
          {footerContent}
          <PoweredByGlideText />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
