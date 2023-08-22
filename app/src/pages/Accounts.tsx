import { Box, Card, Container, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AccountNewDialog from '../components/AccountNewDialog';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';
import { AccountCard } from '../components/AccountCard';
import { UserContext } from '../contexts/UserContext';
import { Add } from '@mui/icons-material';

export default function Accounts() {
  const theme = useTheme();
  const mediumScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { isAuthenticated, accounts, setInitiateAccountsRefresh } = useContext(UserContext);
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
        {isAuthenticated && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: mediumScreen ? 'center' : 'flex-start'
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
                  New account
                </Typography>
                <Typography fontSize={12} fontWeight="bold">
                  Withdraw accumulated funds from your flows and send to other accounts
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
            {accounts &&
              accounts.map((account) => (
                <AccountCard
                  key={`account_card_${account.address}_${account.network}`}
                  account={account}
                />
              ))}
          </Box>
        )}
      </Container>

      <AccountNewDialog
        open={openAccountCreate}
        networks={availableNetworksToAddAccount}
        closeStateCallback={async () => {
          setOpenAccountCreate(false);
          // TODO: just refresh, lately it's better to track each flow's update separately
          setInitiateAccountsRefresh(true);
        }}
      />
    </>
  );
}
