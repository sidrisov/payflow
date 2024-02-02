import { useContext } from 'react';
import { ProfileContext } from '../contexts/UserContext';

import {
  Box,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Switch} from '@mui/material';
import { Helmet } from 'react-helmet-async';

export default function Settings() {
  const { appSettings, setAppSettings } = useContext(ProfileContext);

  return (
    <>
      <Helmet>
        <title> Payflow | Settings </title>
      </Helmet>
      <Container maxWidth="md">
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
        </Box>
      </Container>
    </>
  );
}
