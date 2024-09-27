import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { green } from '@mui/material/colors';
import { MoxieInfoCard } from '../cards/MoxieInfoCard';
import { DegenInfoCard } from '../cards/DegenInfoCard';

interface UsefulTabsProps {
  initialTab?: number;
}

export function UsefulTabs({ initialTab = 0 }: UsefulTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

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
