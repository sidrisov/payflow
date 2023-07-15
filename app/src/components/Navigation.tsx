import { Stack, Tabs, Tab, Link as MuiLink } from '@mui/material';

import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import HomeLogo from './Logo';

import { Settings, Merge, Payments, List as IconList, Payment } from '@mui/icons-material';
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
      <HomeLogo mt={2} ml={-2} />

      <Tabs
        orientation="vertical"
        variant="scrollable"
        scrollButtons="auto"
        value={tabValue}
        textColor="inherit"
        sx={{
          mt: 5,
          minWidth: 150,
          flexGrow: 1
        }}>
        <AlignedLinkTab
          label="Accounts"
          tabIndex={0}
          component={Link}
          to={appRoutes[0]}
          icon={<Payment />}
        />
        <AlignedLinkTab
          label="Flows"
          tabIndex={1}
          component={Link}
          to={appRoutes[1]}
          icon={<Merge />}
        />
        <AlignedLinkTab
          disabled
          label="Requests"
          tabIndex={2}
          to={appRoutes[2]}
          icon={<Payments />}
        />
        <AlignedLinkTab
          disabled
          label="Activity"
          tabIndex={3}
          component={Link}
          to={appRoutes[3]}
          icon={<IconList />}
        />
        <AlignedLinkTab
          label="Settings"
          tabIndex={4}
          component={Link}
          to={appRoutes[4]}
          icon={<Settings />}
        />
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
