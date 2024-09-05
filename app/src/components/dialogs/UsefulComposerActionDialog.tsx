import { Dialog, DialogContent, DialogProps } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { MoxieInfoCard } from '../cards/MoxieInfoCard';
import { DegenInfoCard } from '../cards/DegenInfoCard';
import { useMobile } from '../../utils/hooks/useMobile';

export type UsefulComposerActionDialogProps = DialogProps & CloseCallbackType;

export default function UsefulComposerActionDialog({
  closeStateCallback,
  ...props
}: UsefulComposerActionDialogProps) {
  const isMobile = useMobile();

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      onClose={closeStateCallback}
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
      {/*       <BackDialogTitle
        title="Useful information for you"
        closeStateCallback={closeStateCallback}
        hidden
      /> */}
      <DialogContent>
        <MoxieInfoCard />
        <DegenInfoCard />
      </DialogContent>
    </Dialog>
  );
}
