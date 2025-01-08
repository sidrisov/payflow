import { Box, BoxProps, Button, ButtonProps } from '@mui/material';
import { ProfileType } from '@payflow/common';
import { ProfileSection } from '../ProfileSection';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../../utils/hooks/useMobile';

export default function ProfileSectionButton({
  profile,
  ...props
}: BoxProps & ButtonProps & { profile: ProfileType | undefined }) {
  const navigate = useNavigate();

  const smallScreen = useMobile();

  return (
    profile && (
      <Box
        {...props}
        display="flex"
        flexDirection="row"
        justifyContent="flex-start"
        color="inherit"
        component={Button}
        textTransform="none"
        onClick={async () => {
          if (profile) {
            navigate(`/${profile.username}`);
          }
        }}
        sx={{ borderRadius: 5 }}>
        <ProfileSection profile={profile} fontSize={smallScreen ? 13 : 15} />
      </Box>
    )
  );
}
