import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogProps, Box } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { BackDialogTitle } from '../dialogs/BackDialogTitle';
import { UpSlideTransition } from '../dialogs/TransitionDownUpSlide';
import PoweredByGlideText from '../text/PoweredByGlideText';
import { useMobile } from '../../utils/hooks/useMobile';
import { ExpiryCountdown } from './ExpiryCountdown';

export type BasePaymentDialogProps = DialogProps &
  CloseCallbackType & {
    alwaysShowBackButton?: boolean;
    title?: string;
    subtitle?: string;
    expiresAt?: Date;
    createdAt?: Date;
    children: React.ReactNode;
    footerContent?: React.ReactNode;
    mode?: 'normal' | 'cross-chain';
  };

export function BasePaymentDialog({
  alwaysShowBackButton = false,
  title,
  subtitle,
  expiresAt,
  createdAt,
  children,
  footerContent,
  closeStateCallback,
  mode = 'cross-chain',
  ...props
}: BasePaymentDialogProps) {
  const isMobile = useMobile();

  const calculatedExpiresAt = useMemo(() => {
    if (expiresAt) return expiresAt;
    if (createdAt) {
      const sevenDaysLater = new Date(createdAt);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      return sevenDaysLater;
    }
    return null;
  }, [expiresAt, createdAt]);

  const additionalTitleComponent = calculatedExpiresAt && (
    <ExpiryCountdown expiresAt={calculatedExpiresAt} />
  );

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
        subtitle={subtitle}
        controlComponent={additionalTitleComponent}
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
          {mode === 'cross-chain' && <PoweredByGlideText />}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
