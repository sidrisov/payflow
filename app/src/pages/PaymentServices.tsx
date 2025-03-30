import React from 'react';
import { Stack, Typography, Card, Grid } from '@mui/material';
import { TbGiftFilled, TbSend } from 'react-icons/tb';
import { HiOutlineSquares2X2 } from 'react-icons/hi2';
import { GrStorage } from 'react-icons/gr';
import { Link } from 'react-router';
import { FaRegClock } from 'react-icons/fa';
import PayflowPage from '../components/PayflowPage';

interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  disabled?: boolean;
}

interface ServiceCategoryProps {
  title: string;
  icon: React.ReactNode;
  services: Service[];
}

const ServiceCategory: React.FC<ServiceCategoryProps> = ({ services }) => {
  return (
    <Grid
      width="100%"
      container
      spacing={2}
      columns={{ xs: 2, sm: 2, md: 2 }}
      justifyContent="center">
      {services.map((service, index) => (
        <Grid
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
          }}>
          <Link
            to={service.to}
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}>
            <Stack spacing={1} alignItems="center" justifyContent="center">
              {service.icon}
              <Typography textAlign="center" variant="subtitle2" fontWeight="medium">
                {service.title}
              </Typography>
            </Stack>
          </Link>
        </Grid>
      ))}
    </Grid>
  );
};

export default function PaymentServices() {
  const services = [
    {
      title: 'New Payment',
      description: 'Create a new payment',
      icon: <TbSend size={24} />,
      to: '/payment/create'
    },
    {
      title: 'Claimables',
      description: 'View your claimables',
      icon: <TbGiftFilled size={24} />,
      to: '/~/claimables'
    },
    {
      title: 'Farcaster Storage',
      description: 'Manage farcaster storage',
      icon: <GrStorage size={24} />,
      to: '/~/farcaster/storage'
    },
    {
      title: 'Subscriptions',
      description: 'Manage subscriptions',
      icon: <FaRegClock size={24} />,
      to: '/~/subscriptions'
    },
    {
      title: 'Cast Actions',
      description: 'Manage cast actions',
      icon: <HiOutlineSquares2X2 size={24} />,
      to: '/~/cast-actions'
    }
  ];

  return (
    <PayflowPage title="Payment Services" pageTitle="Payment Services">
      <Stack alignItems="center" mt={3} mb={2} p={2} spacing={3}>
        <ServiceCategory
          title="Services"
          icon={<HiOutlineSquares2X2 size={30} />}
          services={services}
        />
      </Stack>
    </PayflowPage>
  );
}
