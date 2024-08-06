import { Card, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useMemo, useState } from 'react';
import { getAllActiveProfiles } from '../services/user';
import { ProfileType } from '../types/ProfileType';
import ProfileSectionButton from '../components/buttons/ProfileSectionButton';
import calculateMaxPages, { PAGE_SIZE } from '../utils/pagination';

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<ProfileType[]>();
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>();

  useMemo(async () => {
    setLoadingProfiles(true);
    try {
      const profiles = await getAllActiveProfiles();
      setProfiles(profiles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const maxPages = calculateMaxPages(profiles?.length ?? 0, PAGE_SIZE);
  const [page, setPage] = useState<number>(1);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10 && page < maxPages) {
      setPage(page + 1);
    }
  };

  return (
    <>
      <Helmet>
        <title> Payflow | Users </title>
      </Helmet>
      <Container maxWidth="xs">
        <Card
          elevation={5}
          sx={{
            p: 3,
            mt: 5,
            border: 2,
            borderColor: 'divider',
            borderRadius: 5,
            borderStyle: 'double',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            minHeight: 300
          }}>
          <Typography my={1} textAlign="center" variant="h6">
            Users
          </Typography>

          {loadingProfiles ? (
            <CircularProgress color="inherit" size={20} sx={{ m: 1 }} />
          ) : profiles && profiles.length ? (
            <Stack
              p={1}
              maxHeight="65vh"
              overflow="auto"
              spacing={3}
              alignItems="center"
              onScroll={handleScroll}>
              {profiles.slice(0, page * PAGE_SIZE).map((profile, index) => (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">{index + 1}</Typography>
                  <ProfileSectionButton ml={2} width={150} profile={profile} />
                  <Typography variant="caption">
                    joined on: {new Date(profile.createdDate).toLocaleDateString()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography textAlign="center" variant="subtitle2">
              No profiles available
            </Typography>
          )}
        </Card>
      </Container>
    </>
  );
}
