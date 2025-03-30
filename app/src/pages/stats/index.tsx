import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Container, Grid, Typography, Skeleton, CardContent, Card } from '@mui/material';
import { API_URL } from '../../utils/urlConstants';
import { LineChart } from '@mui/x-charts/LineChart';

interface DailyStats {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalPayments: number;
  completedPayments: number;
  p2pPayments: number;
  mintTokensPurchased: number;
  storageUnitsPurchased: number;
  hypersubMonthsSubscribed: number;
}

interface ActiveUsersStats {
  date: string;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await axios.get<DailyStats>(`${API_URL}/api/stats/daily`);
      return data;
    }
  });

  const { data: activeUsersStats, isLoading: isLoadingActiveUsers } = useQuery({
    queryKey: ['activeUsersStats'],
    queryFn: async () => {
      const { data } = await axios.get<ActiveUsersStats[]>(`${API_URL}/api/stats/active-users`);
      return data;
    }
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Payflow Stats Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Users" value={stats?.totalUsers} isLoading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Users"
            value={
              stats &&
              `${stats.dailyActiveUsers}/${stats.weeklyActiveUsers}/${stats.monthlyActiveUsers}`
            }
            subtitle="DAU/WAU/MAU"
            isLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="All Payments"
            value={stats && `${stats.completedPayments}/${stats.totalPayments}`}
            subtitle="Completed/Total"
            isLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="P2P + Rewards Payments"
            value={stats?.p2pPayments}
            subtitle="Completed"
            isLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Storage Units"
            value={stats?.storageUnitsPurchased}
            subtitle="Purchased"
            isLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Collectibles"
            value={stats?.mintTokensPurchased}
            subtitle="Minted"
            isLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Hypersub"
            value={stats?.hypersubMonthsSubscribed}
            subtitle="Months Subscribed"
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, height: 400 }}>
        <Typography variant="h6" gutterBottom>
          Active Users Over Time
        </Typography>
        {isLoadingActiveUsers ? (
          <Skeleton variant="rectangular" height={350} />
        ) : (
          <LineChart
            series={[
              {
                data: activeUsersStats?.map((stat) => stat.monthlyActiveUsers),
                label: 'Monthly Active Users',
                color: '#ffc658'
              },
              {
                data: activeUsersStats?.map((stat) => stat.weeklyActiveUsers),
                label: 'Weekly Active Users',
                color: '#82ca9d'
              },
              {
                data: activeUsersStats?.map((stat) => stat.dailyActiveUsers),
                label: 'Daily Active Users',
                color: '#8884d8'
              }
            ]}
            xAxis={[
              {
                data: activeUsersStats?.map((stat) => new Date(stat.date)),
                scaleType: 'point',
                valueFormatter: (value: number) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }
              }
            ]}
            height={375}
          />
        )}
      </Box>
    </Container>
  );
}

interface StatCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, subtitle, isLoading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', borderRadius: 5 }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {isLoading ? (
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width="60%" height={40} />
            {subtitle && <Skeleton variant="text" width="40%" />}
          </Box>
        ) : (
          <>
            <Typography variant="h4" component="div">
              {value || '0'}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
