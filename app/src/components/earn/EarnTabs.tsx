import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Stack } from '@mui/material';
import { green } from '@mui/material/colors';
import { MoxieInfoCard } from '../cards/MoxieInfoCard';
import { DegenInfoCard } from '../cards/DegenInfoCard';
/* import { ZoraInfoCard } from '../cards/ZoraInfoCard';
import { HypersubInfoCard } from '../cards/HypersubInfoCard'; */

interface EarnTabsProps {
  tab?: string;
}

const getTabIndex = (tab: string | undefined): number => {
  switch (tab?.toLowerCase()) {
    case 'moxie':
    case 'degen':
      return 0;
    case 'contributions':
      return 1;
    case 'paymentlinks':
      return 2;
    case 'subscriptions':
      return 3;
    default:
      return 0;
  }
};

export function EarnTabs({ tab }: EarnTabsProps) {
  const [activeTab, setActiveTab] = useState(getTabIndex(tab));

  useEffect(() => {
    const tabIndex = getTabIndex(tab);
    setActiveTab(tabIndex);
  }, [tab]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTabs-flexContainer': {
            gap: 1
          },
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: 14,
            borderRadius: '16px',
            minHeight: '48px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            '&.Mui-selected': {
              color: green.A700,
              fontWeight: 'bolder'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: green.A700,
            height: 3,
            borderRadius: '3px'
          },
          '& .MuiTouchRipple-root': {
            borderRadius: '16px'
          }
        }}>
        <Tab label="Claimables" disableRipple />
        <Tab disabled label="Contributions" disableRipple />
        <Tab disabled label="Payment Links" disableRipple />
        <Tab disabled label="Subscriptions" disableRipple />
      </Tabs>

      {activeTab === 0 && (
        <Stack spacing={1}>
          <MoxieInfoCard />
          <DegenInfoCard />
        </Stack>
      )}
    </>
  );
}
