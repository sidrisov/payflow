import { Stack, Tabs, Tab, Link as MuiLink } from '@mui/material';

import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import HomeLogo from './Logo';

import { Merge, Payments, Home } from '@mui/icons-material';
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
      <HomeLogo mt={2.5} ml={-3} />

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
        }}
        TabIndicatorProps={{
          style: {
            display: 'none'
          }
        }}>
        <AlignedLinkTab label="Home" tabIndex={0} to={appRoutes[0]} icon={<Home />} />
        <AlignedLinkTab label="Flows" tabIndex={1} to={appRoutes[1]} icon={<Merge />} />

        <AlignedLinkTab label="Requests" tabIndex={2} to={appRoutes[2]} icon={<Payments />} />

        {/*         <AlignedLinkTab label="Settings" tabIndex={5} to={appRoutes[3]} icon={<Settings />} /> */}
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
