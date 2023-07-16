import { Box, Button, Card, Container, Stack, Typography } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount } from 'wagmi';
import axios from 'axios';
import AccountNewDialog from '../components/AccountNewDialog';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';
import { AccountCard } from '../components/AccountCard';
import { UserContext } from '../contexts/UserContext';

export default function Accounts() {
  const { isConnected, address } = useAccount();

  const { accounts, setAccounts } = useContext(UserContext);
  const [fetched, setFetched] = useState(false);
  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState<string[]>([]);

  const [openAccountCreate, setOpenAccountCreate] = useState(false);

  async function fetchAccounts() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/accounts?userId=${address}`
      );

      setAccounts(response.data);
      setFetched(true);
    } catch (error) {
      console.log(error);
    }
  }

  useMemo(async () => {
    if (isConnected) {
      fetchAccounts();
    }
  }, [isConnected]);

  useMemo(async () => {
    if (fetched && accounts) {
      let availableNetworks = smartAccountCompatibleChains();
      if (accounts.length > 0) {
        const addedNetworks = accounts.map((account) => account.network);
        availableNetworks = availableNetworks.filter((c) => !addedNetworks.includes(c));
      }
      setAvailableNetworksToAddAccount(availableNetworks);
    }
  }, [fetched, accounts]);

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
                  width: 250,
                  height: 200,
                  border: 3,
                  borderRadius: 3,
                  borderStyle: 'dashed',
                  borderColor: 'divider'
                }}>
                <Stack direction="column" spacing={1}>
                  <Typography fontSize={20} fontWeight="bold">
                    New Account
                  </Typography>
                  <Typography fontSize={12} fontWeight="bold">
                    Withdraw accumulated funds from your flows to accounts
                  </Typography>
                  <Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="medium"
                      sx={{
                        mt: 1,
                        borderRadius: 3
                      }}
                      onClick={() => {
                        setOpenAccountCreate(true);
                      }}>
                      Create
                    </Button>
                  </Box>
                </Stack>
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
          fetchAccounts();
        }}
      />
    </>
  );
}
