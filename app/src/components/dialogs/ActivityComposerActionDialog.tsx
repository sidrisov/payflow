import { Dialog, DialogTitle, DialogContent, DialogProps } from '@mui/material';
import PublicProfileActivityFeed from '../PublicProfileActivityFeed';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { Address } from 'viem';
import { useMobile } from '../../utils/hooks/useMobile';

type ActivityComposerActionDialogProps = DialogProps;

export default function ActivityComposerActionDialog({
  ...props
}: ActivityComposerActionDialogProps) {
  const { profile } = useContext(ProfileContext);
  const isMobile = useMobile();

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      {...props}
      PaperProps={{
        elevation: 2,
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
        {profile && (
          <PublicProfileActivityFeed
            identity={{
              address: profile.identity as Address,
              profile: profile
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
