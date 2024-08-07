import { Box, Card, CardProps } from '@mui/material';
import { IdentityType } from '../../types/ProfileType';
import PublicProfileActivityFeed from '../PublicProfileActivityFeed';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails';
import { useSearchParams } from 'react-router-dom';

export function PublicProfileCard({ identity, ...props }: { identity: IdentityType } & CardProps) {
  const [searchParams] = useSearchParams();
  const pay = searchParams.get('pay');

  return (
    <>
      <Card
        {...props}
        elevation={3}
        sx={{
          m: 2,
          p: 2,
          border: 1.5,
          borderColor: 'divider',
          borderRadius: 5
        }}>
        <PublicProfileDetails openPayDialogParam={pay !== null} identity={identity} />
      </Card>

      {identity?.profile?.defaultFlow && (
        <Box mx={1}>
          <PublicProfileActivityFeed flow={identity?.profile?.defaultFlow} />
        </Box>
      )}
    </>
  );
}
