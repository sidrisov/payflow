import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Card, Tabs, Tab, Box } from '@mui/material';
import { green } from '@mui/material/colors';

import { ProfileContext } from '../contexts/UserContext';
import { DegenInfoCard } from '../components/cards/DegenInfoCard';
import { MoxieInfoCard } from '../components/cards/MoxieInfoCard';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';

export default function Useful() {
  const { isAuthenticated } = useContext(ProfileContext);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Payflow | Useful </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100vh' }}>
        {isAuthenticated ? (
          <Card elevation={5} sx={{ mt: 2, p: 3, borderRadius: 4, height: 'auto' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                mb: 2,
                '& .MuiTabs-flexContainer': {
                  gap: 1 // Add some space between tabs
                },
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  borderRadius: '16px', // Rounded corners for tabs
                  minHeight: '48px', // Adjust height as needed
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)' // Slight background on hover
                  },
                  '&.Mui-selected': {
                    color: green.A700,
                    fontWeight: 'bolder'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: green.A700,
                  height: 3,
                  borderRadius: '3px' // Rounded corners for the indicator
                },
                '& .MuiTouchRipple-root': {
                  borderRadius: '16px' // Rounded corners for the ripple effect
                }
              }}>
              <Tab label="Moxie" disableRipple />
              <Tab label="Degen" disableRipple />
            </Tabs>

            <Box>
              {activeTab === 0 && <MoxieInfoCard />}
              {activeTab === 1 && <DegenInfoCard />}
            </Box>
          </Card>
        ) : (
          <LoadingPayflowEntryLogo />
        )}
      </Container>
    </>
  );
}
