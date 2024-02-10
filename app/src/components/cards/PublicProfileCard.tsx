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
  {
    /*  <Stack
              overflow="auto"
              m={1}
              spacing={1}
              justifyContent={isSmallScreen ? 'flex-start' : 'center'}
              direction="row"
              p={1}>
              <Chip
                clickable
                icon={<MonetizationOn />}
                label="Tipping"
                sx={{ backgroundColor: 'inherit' }}></Chip>
              <Chip icon={<Savings />} label="Jars"></Chip>
              <Chip
                clickable
                icon={<Payment />}
                label="Subscriptions"
                sx={{ backgroundColor: 'inherit' }}></Chip>
              <Chip
                clickable
                icon={<Campaign />}
                label="Campaigns"
                sx={{ backgroundColor: 'inherit' }}></Chip>
            </Stack>

            <Typography variant="h6" textAlign="center">
              {comingSoonText}
            </Typography> */
  }

  {
    /* {flows &&
          flows.map((flow) => (
            <Card
              key={`flow_card_${flow.uuid}`}
              elevation={5}
              sx={{
                m: 2,
                p: 2,
                border: 3,
                borderRadius: 5,
                borderStyle: 'double',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}>
              <Box
                sx={{
                  p: 0.8,
                  pb: 0.4,
                  borderRadius: 5,
                  border: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'inherit'
                }}>
                <QRCode
                  size={100}
                  alignmentBaseline="baseline"
                  alphabetic="true"
                  value={`${DAPP_URL}/jar/${flow.uuid}`}
                />
              </Box>
              <Box
                ml={1}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignContent="flex-start"
                width={300}>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                  <Stack spacing={1}>
                    <Typography fontSize={20} fontWeight="bold" maxHeight={60} overflow="auto">
                      {flow.title}
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" maxHeight={50} overflow="auto">
                      {flow.description}
                    </Typography>
                  </Stack>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="subtitle2">${0}</Typography>
                  <AvatarGroup
                    max={5}
                    total={flow.wallets.length}
                    sx={{
                      '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 }
                    }}>
                    {[...Array(Math.min(4, flow.wallets.length))].map((_item, i) => (
                
                        <NetworkAvatar tooltip network={flow.wallets[i].network} />
                    ))}
                  </AvatarGroup>
                </Box>
              </Box>
              <IconButton
                color="inherit"
                onClick={async () => {
                  navigate(`/jar/${flow.uuid}`);
                }}
                sx={{ ml: 1, border: 1.5, borderStyle: 'dashed' }}>
                <ArrowForward fontSize="medium" />
              </IconButton>
            </Card>
          ))} */
  }
}
