import { Box, Card, CardProps } from '@mui/material';
import { IdentityType } from '../../types/ProfileType';
import PublicProfileActivityFeed from '../PublicProfileActivityFeed';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails';
import { useSearchParams } from 'react-router-dom';

export function PublicProfileCard({ identity, ...props }: { identity: IdentityType } & CardProps) {
  const [searchParams] = useSearchParams();
  const pay = searchParams.get('pay');

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Card
        {...props}
        elevation={3}
        sx={{
          m: 2,
          p: 2,
          borderRadius: 5,
          flexShrink: 0
        }}>
        <PublicProfileDetails openPayDialogParam={pay !== null} identity={identity} />
      </Card>

      <PublicProfileActivityFeed identity={identity} />
    </Box>
  );
}
