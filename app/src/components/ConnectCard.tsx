import { Avatar, Box, Card, Stack, Typography } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { green } from '@mui/material/colors';
import { CheckCircle } from '@mui/icons-material';

function FeatureSection({ description }: { description: string }) {
  return (
    <Stack spacing={1} direction="row" alignItems="center">
      <CheckCircle color="inherit" />
      <Typography variant="subtitle2" fontSize={15} fontWeight="bold">
        {description}
      </Typography>
    </Stack>
  );
}
export function ConnectCard() {
  const { address } = useAccount();
  return (
    <Card
      elevation={10}
      sx={{
        m: 2,
        p: 1,
        border: 3,
        borderRadius: 5,
        borderStyle: 'double',
        borderColor: 'divider',
        maxWidth: 400
      }}>
      <Box
        m={1}
        p={1}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          borderRadius: 5
        }}>
        <Stack my={3} spacing={1} direction="row" alignItems="center">
          <Avatar src="/payflow.png" />
          <Typography flexWrap="wrap" variant="h5" textAlign="center">
            welcome to
          </Typography>

          <Typography flexWrap="wrap" variant="h5" textAlign="center">
            <b>
              <u>payflow</u>
            </b>
          </Typography>
        </Stack>

        <Stack my={1} p={1} spacing={2} alignItems="flex-start" color={green.A700}>
          <FeatureSection description="create a flow abstracted from social wallet" />
          <FeatureSection description="discover friends by farcaster, lens, and ens" />
          <FeatureSection description="send, receive, request crypto, and more" />
        </Stack>

        <Typography my={1} variant="caption" fontWeight="bold" textAlign="center">
          <u>
            <b>{'Identity'}</b>
          </u>
          {': '}your ethereum address linked to web3 socials (ens, farcaster, lens) for seamless
          profile discovery and payments with your friends.
        </Typography>

        <Box my={2}>
          <ConnectButton
            label={address ? 'Verify Identity' : 'Connect Identity'}
            showBalance={{ smallScreen: false, largeScreen: false }}
          />
        </Box>
      </Box>
    </Card>
  );
}
