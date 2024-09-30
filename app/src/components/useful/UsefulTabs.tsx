import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { green } from '@mui/material/colors';
import { MoxieInfoCard } from '../cards/MoxieInfoCard';
import { DegenInfoCard } from '../cards/DegenInfoCard';

interface UsefulTabsProps {
  tab?: string;
}

const getTabIndex = (tab: string | undefined): number => {
  switch (tab?.toLowerCase()) {
    case 'degen':
      return 0;
    case 'moxie':
      return 1;
    default:
      return 0;
  }
};

export function UsefulTabs({ tab }: UsefulTabsProps) {
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
        sx={{
          mb: 2,
          '& .MuiTabs-flexContainer': {
            gap: 1
          },
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: '1rem',
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
        <Tab label="Degen" disableRipple />
        <Tab label="Moxie" disableRipple />
      </Tabs>

      <Box>
        {activeTab === 0 && <DegenInfoCard />}
        {activeTab === 1 && <MoxieInfoCard />}
      </Box>
    </>
  );
}
