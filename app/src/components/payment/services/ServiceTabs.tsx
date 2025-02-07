import React, { useState } from 'react';
import { Stack, Typography, Paper, Grid2, Card, Divider } from '@mui/material';
import { DegenInfoCard } from '../../cards/DegenInfoCard';
import CastActions from './CastActions';
import { TbGiftFilled, TbSend } from 'react-icons/tb';
import { HiOutlineSquares2X2 } from 'react-icons/hi2';
import { GrStorage } from 'react-icons/gr';
import { useNavigate } from 'react-router-dom';

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

interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

interface ServiceCategoryProps {
  title: string;
  icon: React.ReactNode;
  services: Service[];
}

const ServiceCategory: React.FC<ServiceCategoryProps> = ({ services }) => {
  return (
    <Grid2
      width="100%"
      container
      spacing={2}
      columns={{ xs: 2, sm: 2, md: 2 }}
      justifyContent="center">
      {services.map((service, index) => (
        <Grid2
          key={index}
          component={Card}
          elevation={5}
          size={{ xs: 1, sm: 1, md: 1 }}
          sx={{
            p: 2,
            cursor: service.disabled ? 'default' : 'pointer',
            opacity: service.disabled ? 0.5 : 1,
            '&:hover': {
              bgcolor: service.disabled ? 'inherit' : 'action.hover'
            }
          }}
          onClick={service.onClick}
          display="flex"
          justifyContent="center"
          alignItems="center">
          <Stack spacing={1} alignItems="center" justifyContent="center">
            {service.icon}
            <Typography textAlign="center" variant="subtitle2" fontWeight="medium">
              {service.title}
            </Typography>
          </Stack>
        </Grid2>
      ))}
    </Grid2>
  );
};

export function ServiceTabs({ tab }: ServiceTabsProps) {
  const [activeTab, setActiveTab] = useState(getTabIndex(tab));
  const navigate = useNavigate();

  const services = [
    {
      title: 'New Payment',
      description: 'Create a new payment',
      icon: <TbSend size={24} />,
      onClick: () => navigate('/payment/create')
    },
    {
      title: 'Claimables',
      description: 'View your claimables',
      icon: <TbGiftFilled size={24} />,
      onClick: () => setActiveTab(0)
    },
    {
      title: 'Cast Actions',
      description: 'Manage cast actions',
      icon: <HiOutlineSquares2X2 size={24} />,
      onClick: () => setActiveTab(1)
    },
    {
      title: 'Farcaster Storage',
      description: 'Manage farcaster storage',
      icon: <GrStorage size={24} />,
      onClick: () => navigate('/farcaster/storage')
    }
  ];

  return (
    <>
      <Stack alignItems="center" mt={3} mb={2} p={2} spacing={3}>
        <ServiceCategory
          title="Services"
          icon={<HiOutlineSquares2X2 size={30} />}
          services={services}
        />

        <Divider flexItem />

        {activeTab === 0 ? <DegenInfoCard /> : activeTab === 1 ? <CastActions /> : null}
      </Stack>
    </>
  );
}
