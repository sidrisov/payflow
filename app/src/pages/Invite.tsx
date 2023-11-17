import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserContext } from '../contexts/UserContext';
import { Box, Button, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { InvitationType } from '../types/InvitationType';
import { getAllInvitations } from '../services/invitation';
import CodeOrAddressInvitationSection from '../components/CodeOrAddressInvitationSection';
import { ProfileSection } from '../components/ProfileSection';
import { useNavigate } from 'react-router-dom';
import PayflowChip from '../components/PayflowChip';

export default function Invite() {
  const { profile } = useContext(UserContext);

  const [loadingInvitations, setLoadingInvitations] = useState<boolean>();
  const [invitations, setInvitations] = useState<InvitationType[]>();

  const navigate = useNavigate();

  useMemo(async () => {
    setLoadingInvitations(true);

    try {
      const invitations = await getAllInvitations();

      console.log(invitations);
      setInvitations(invitations);
    } finally {
      setLoadingInvitations(false);
    }
  }, [profile]);

  return (
    <>
      <Helmet>
        <title> PayFlow | Invite </title>
      </Helmet>
      <Container maxWidth="sm" sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" justifyContent="flex-start" alignItems="center">
          {loadingInvitations ? (
            <CircularProgress color="inherit" size={20} />
          ) : invitations ? (
            invitations.length === 0 ? (
              <Typography alignSelf="center" variant="subtitle2">
                No invitations available.
              </Typography>
            ) : (
              <Box>
                <Stack direction="row" spacing={1}>
                  <Box width={150}>
                    <Typography variant="caption" textAlign="center">
                      Available codes
                    </Typography>

                    <Stack maxHeight={300} sx={{ p: 1, overflowY: 'scroll' }}>
                      {invitations
                        .filter((inv) => inv.code && !inv.invitee)
                        .map((inv) => (
                          <CodeOrAddressInvitationSection codeOrAddress={inv.code} />
                        ))}
                    </Stack>
                  </Box>
                  <Box width={150}>
                    <Typography variant="caption" textAlign="start">
                      Invited addresses
                    </Typography>
                    <Stack maxHeight={300} sx={{ p: 1, overflowY: 'scroll' }}>
                      {invitations
                        .filter((inv) => inv.identity && !inv.invitee)
                        .map((inv) => (
                          <CodeOrAddressInvitationSection codeOrAddress={inv.identity} />
                        ))}
                    </Stack>
                  </Box>
                </Stack>
                <Box mt={5} width={250}>
                  <Typography variant="caption" textAlign="start">
                    Joined profiles
                  </Typography>
                  <Stack maxHeight={300} sx={{ p: 1, overflowY: 'scroll' }}>
                    {invitations
                      .filter((inv) => inv.invitee)
                      .map((inv) => (
                        <Box
                          color="inherit"
                          p={1}
                          flexGrow={1}
                          display="flex"
                          flexDirection="row"
                          justifyContent="space-between"
                          alignItems="center"
                          component={Button}
                          textTransform="none"
                          sx={{ borderRadius: 5, textTransform: 'none' }}
                          onClick={async () => {
                            navigate(`/${inv.invitee.username}`);
                          }}>
                          <ProfileSection profile={inv.invitee} />
                          <PayflowChip />
                        </Box>
                      ))}
                  </Stack>
                </Box>
              </Box>
            )
          ) : (
            <Typography alignSelf="center" variant="subtitle2">
              We were unable to retrieve invitations. Try again.
            </Typography>
          )}
        </Box>
      </Container>
    </>
  );
}
