import { Box, Card, CardProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { useTransactionsFetcher } from '../../utils/hooks/useTransactionsFetcher';
import PublicProfileActivityFeed from '../PublicProfileActivityFeed';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails';
import { useSearchParams } from 'react-router-dom';

export function PublicProfileCard({ profile, ...props }: { profile: ProfileType } & CardProps) {
  const activityFetchResult = useTransactionsFetcher(profile?.defaultFlow?.wallets ?? []);

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
        <PublicProfileDetails openPayDialogParam={pay !== null} profile={profile} />
      </Card>

      <Box mx={1}>
        <PublicProfileActivityFeed activityFetchResult={activityFetchResult} />
      </Box>
    </>
  );
}
