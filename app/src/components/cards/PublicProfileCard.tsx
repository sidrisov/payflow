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
      <Box flexShrink={0}>
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
      </Box>

      <Box mx={1} flexGrow={1} overflow="hidden" mb={20}>
        <PublicProfileActivityFeed identity={identity} />
      </Box>
    </Box>
  );
}
