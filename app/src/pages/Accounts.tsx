import { Box, Button, Card, Container, IconButton, Stack, Typography } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount } from 'wagmi';
import AccountNewDialog from '../components/AccountNewDialog';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';
import { AccountCard } from '../components/AccountCard';
import { UserContext } from '../contexts/UserContext';
import { Add } from '@mui/icons-material';

export default function Accounts() {
  const { isConnected } = useAccount();

  const { accounts, setInitiateRefresh } = useContext(UserContext);
  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState<string[]>([]);

  const [openAccountCreate, setOpenAccountCreate] = useState(false);

  useMemo(async () => {
    if (accounts) {
      let availableNetworks = smartAccountCompatibleChains();
      if (accounts.length > 0) {
        const addedNetworks = accounts.map((account) => account.network);
        availableNetworks = availableNetworks.filter((c) => !addedNetworks.includes(c));
      }
      setAvailableNetworksToAddAccount(availableNetworks);
    }
  }, [accounts]);

  return (
    <>
      <Helmet>
        <title> PayFlow | Accounts </title>
      </Helmet>
      <Container>
        {isConnected && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-start'
            }}>
            {availableNetworksToAddAccount.length > 0 && (
              <Card
                elevation={10}
                sx={{
                  m: 2,
                  p: 2,
                  width: 350,
                  height: 200,
                  border: 3,
                  borderRadius: 5,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                <Typography fontSize={20} fontWeight="bold">
                  New Account
                </Typography>
                <Typography fontSize={12} fontWeight="bold">
                  Withdraw accumulated funds from your flows to accounts
                </Typography>

                <IconButton
                  color="inherit"
                  onClick={() => {
                    setOpenAccountCreate(true);
                  }}
                  sx={{
                    border: 1,
                    borderStyle: 'dashed',
                    alignSelf: 'flex-end',
                    justifySelf: 'flex-end'
                  }}>
                  <Add />
                </IconButton>
              </Card>
            )}
            {accounts && accounts.map((account) => <AccountCard account={account} />)}
          </Box>
        )}
      </Container>

      <AccountNewDialog
        open={openAccountCreate}
        networks={availableNetworksToAddAccount}
        closeStateCallback={async () => {
          setOpenAccountCreate(false);
          // TODO: just refresh, lately it's better to track each flow's update separately
          setInitiateRefresh(true);
        }}
      />
    </>
  );
}
