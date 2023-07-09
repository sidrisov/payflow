import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Switch,
  Typography
} from '@mui/material';
import { Helmet } from 'react-helmet-async';

export default function Settings() {
  const { appSettings, setAppSettings } = useContext(UserContext);

  return (
    <>
      <Helmet>
        <title> PayFlow | Settings </title>
      </Helmet>
      <Box mt={3} display="flex" flexDirection="column">
        <Typography align="center" color="primary" variant="h6" m={1}>
          Settings
        </Typography>
        <Box
          sx={{
            alignSelf: 'flex-start',
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            p: 1,
            mt: 3
          }}>
          <FormControl sx={{ m: 1, p: 1 }}>
            <FormLabel>User Interface</FormLabel>
            <FormGroup sx={{ m: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.darkMode}
                    onChange={() => {
                      setAppSettings({
                        ...appSettings,
                        darkMode: !appSettings.darkMode
                      });
                    }}
                  />
                }
                label="Dark Theme"
              />
            </FormGroup>
          </FormControl>
          <FormControl sx={{ m: 1, p: 1 }}>
            <FormLabel>Wallet Connection</FormLabel>
            <FormGroup sx={{ m: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.autoConnect}
                    onChange={() => {
                      setAppSettings({
                        ...appSettings,
                        autoConnect: !appSettings.autoConnect
                      });
                    }}
                  />
                }
                label="Auto connect"
              />
            </FormGroup>
          </FormControl>
        </Box>
      </Box>
    </>
  );
}
