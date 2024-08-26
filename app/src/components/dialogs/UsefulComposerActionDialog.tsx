import { Dialog, DialogContent, DialogProps, useMediaQuery, useTheme } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { BackDialogTitle } from './BackDialogTitle';
import { MoxieInfoCard } from '../cards/MoxieInfoCard';

export type UsefulComposerActionDialogProps = DialogProps & CloseCallbackType;

export default function UsefulComposerActionDialog({
  closeStateCallback,
  ...props
}: UsefulComposerActionDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
            borderRadius: 5
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <BackDialogTitle
        title="Useful information for you"
        closeStateCallback={closeStateCallback}
        hidden
      />
      <DialogContent>
        <MoxieInfoCard />
      </DialogContent>
    </Dialog>
  );
}
