import { Stack, Tabs, Tab, Link as MuiLink } from '@mui/material';

import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import HomeLogo from './Logo';

import { Settings, Merge, Payments, Link as LinkIcon, Savings, Home } from '@mui/icons-material';
import { appRoutes } from '../appRouter';

export default function Navigation() {
  const { pathname } = useLocation();
  const [tabValue, setTabValue] = useState(0);

  useMemo(async () => {
    const index = appRoutes.indexOf(pathname);
    if (index !== -1) {
      setTabValue(appRoutes.indexOf(pathname));
    }
  }, [pathname]);

  function AlignedLinkTab(props: any) {
    return (
      <Tab
        component={Link}
        {...props}
        sx={{
          alignSelf: 'flex-start',
          '&.MuiTab-root': { textTransform: 'none' }
        }}
        iconPosition="start"
      />
    );
  }

  return (
    <Stack
      sx={{
        height: '100vh',
        alignItems: 'center'
      }}>
      <HomeLogo mt={2} ml={-3} />

      <Tabs
        orientation="vertical"
        variant="scrollable"
        scrollButtons={false}
        value={tabValue}
        textColor="inherit"
        sx={{
          mt: 10,
          minWidth: 150,
          flexGrow: 1
        }}>
        <AlignedLinkTab label="Home" tabIndex={0} to={appRoutes[0]} icon={<Home />} />
        <AlignedLinkTab label="Flows" tabIndex={1} to={appRoutes[1]} icon={<Merge />} />

        <AlignedLinkTab label="Requests" tabIndex={2} to={appRoutes[2]} icon={<Payments />} />
{/*         <AlignedLinkTab label="Links" tabIndex={3} to={appRoutes[3]} icon={<LinkIcon />} />

        <AlignedLinkTab label="Tipping" tabIndex={4} to={appRoutes[4]} icon={<Savings />} /> */}
        <AlignedLinkTab label="Settings" tabIndex={5} to={appRoutes[3]} icon={<Settings />} />

        {/* 
        <AlignedLinkTab
          label="Donation"
          tabIndex={6}
          to={appRoutes[6]}
          icon={<VolunteerActivism />}
        />
        <AlignedLinkTab label="Store" tabIndex={7} to={appRoutes[7]} icon={<Store />} /> */}
      </Tabs>
      <MuiLink
        mb={1}
        variant="overline"
        underline="hover"
        color="grey"
        href="https://github.com/sidrisov">
        Made by Sinaver
      </MuiLink>
    </Stack>
  );
}
