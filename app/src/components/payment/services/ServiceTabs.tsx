import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Stack } from '@mui/material';
import { DegenInfoCard } from '../../cards/DegenInfoCard';
import CastActions from './CastActions';
import { TbGiftFilled } from 'react-icons/tb';
import { HiOutlineSquares2X2 } from 'react-icons/hi2';
interface ServiceTabsProps {
  tab?: string;
}

const getTabIndex = (tab: string | undefined): number => {
  switch (tab?.toLowerCase()) {
    case 'claimables':
    case 'moxie':
    case 'degen':
      return 0;
    case 'cast_actions':
      return 1;
    case 'contributions':
      return 2;
    case 'links':
      return 3;
    case 'subscriptions':
      return 4;
    default:
      return 0;
  }
};

export function ServiceTabs({ tab }: ServiceTabsProps) {
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
              fontWeight: 'bolder'
            }
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px'
          },
          '& .MuiTouchRipple-root': {
            borderRadius: '16px'
          }
        }}>
        <Tab icon={<TbGiftFilled size={20} />} label="Claimables" disableRipple />
        <Tab icon={<HiOutlineSquares2X2 size={20} />} label="Cast Actions" disableRipple />
        <Tab disabled label="Contributions" disableRipple />
        <Tab disabled label="Payment Links" disableRipple />
        <Tab disabled label="Subscriptions" disableRipple />
      </Tabs>

      {activeTab === 0 ? (
        <Stack spacing={1}>
          <DegenInfoCard />
        </Stack>
      ) : activeTab === 1 ? (
        <Stack spacing={1}>
          <CastActions />
        </Stack>
      ) : null}
    </>
  );
}
