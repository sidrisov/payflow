import { Badge, Box, Chip, Container, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { ProfileType } from '../types/ProfleType';
import { Search } from '@mui/icons-material';
import { API_URL } from '../utils/urlConstants';
import SearchProfileDialog from '../components/SearchProfileDialog';
import { green, grey, orange } from '@mui/material/colors';
import { AppSettings } from '../types/AppSettingsType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { PublicProfileCard } from '../components/PublicProfileCard';

export default function PublicProfile({ appSettings }: { appSettings: AppSettings }) {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType>();
  const [loadingProfile, setLoadingProfile] = useState<boolean>();

  const { darkMode } = appSettings;

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);

  useMemo(async () => {
    if (username) {
      setLoadingProfile(true);
      try {
        const response = await axios.get(`${API_URL}/api/user/${username}`);
        const profile = (await response.data) as ProfileType;
        setProfile(profile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfile(false);
      }
    }
  }, [username]);

  return (
    <>
      <Helmet>
        <title> Payflow {profile ? '| ' + profile.displayName : ''} </title>
      </Helmet>
      <Container maxWidth={!loadingProfile && !profile ? 'sm' : 'xs'}>
        {username && !loadingProfile && !profile && (
          <Typography mt={10} variant="h6" textAlign="center" color={orange.A400}>
            Ooops, not found 🤷🏻‍♂️ try to search by social identity👇🏻
          </Typography>
        )}

        {loadingProfile === true ? (
          <CenteredCircularProgress />
        ) : profile ? (
          <PublicProfileCard profile={profile} />
        ) : (
          <Box
            position="absolute"
            display="flex"
            flexDirection="column"
            alignItems="center"
            boxSizing="border-box"
            justifyContent="center"
            sx={{ inset: 0 }}>
            <Stack spacing={1} alignItems="center" sx={{ border: 0 }}>
              <Badge
                badgeContent={
                  <Typography variant="h5" fontWeight="900" color={green.A700} sx={{ mb: 3 }}>
                    made easy
                  </Typography>
                }>
                <Typography variant="h3" fontWeight="500" textAlign="center">
                  Onchain Social Payments
                </Typography>
              </Badge>

              <Typography variant="caption" fontSize={16} color="grey">
                Safe, gasless, farcaster/lens/ens supported
              </Typography>

              <Chip
                size="medium"
                clickable
                icon={<Search color="inherit" />}
                variant="outlined"
                label="search & pay your friend"
                onClick={() => {
                  setOpenSearchProfile(true);
                }}
                sx={{
                  border: 2,
                  backgroundColor: darkMode ? grey[800] : grey[50],
                  borderStyle: 'dotted',
                  borderColor: 'divider',
                  borderRadius: 10,
                  width: 300,
                  '& .MuiChip-label': { fontSize: 20 },
                  height: 50
                }}
              />
            </Stack>
          </Box>
        )}
      </Container>
      <SearchProfileDialog
        open={openSearchProfile}
        sx={{
          backdropFilter: 'blur(10px)'
        }}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
      />
    </>
  );
}
