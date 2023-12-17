import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserContext } from '../contexts/UserContext';
import { Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { InvitationType } from '../types/InvitationType';
import { getAllInvitations } from '../services/invitation';
import CodeOrAddressInvitationSection from '../components/CodeOrAddressInvitationSection';
import { ProfileSection } from '../components/ProfileSection';
import { useNavigate } from 'react-router-dom';

export default function Invite() {
  const { profile } = useContext(UserContext);

  const [loadingInvitations, setLoadingInvitations] = useState<boolean>();
  const [invitations, setInvitations] = useState<InvitationType[]>();
  const [codes, setCodes] = useState<{ code: string; count: number }[]>();
  const [pending, setPending] = useState<InvitationType[]>();
  const [joined, setJoined] = useState<InvitationType[]>();

  const navigate = useNavigate();

  useMemo(async () => {
    setLoadingInvitations(true);

    try {
      const invitations = await getAllInvitations();

      if (invitations) {
        setPending(invitations.filter((inv) => inv.identity && !inv.invitee));
        setJoined(invitations.filter((inv) => inv.invitee));

        var codes: { code: string; count: number }[] = [];
        invitations
          .filter((inv) => inv.code && !inv.invitee)
          .reduce(function (res: any, value) {
            if (!res[value.code]) {
              res[value.code] = { code: value.code, count: 0 };
              codes.push(res[value.code]);
            }
            res[value.code].count += 1;
            return res;
          }, {});

        setCodes(codes);
      }

      console.log(invitations);
      setInvitations(invitations);
    } finally {
      setLoadingInvitations(false);
    }
  }, [profile]);

  return (
    <>
      <Helmet>
        <title> Payflow | Invite </title>
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
                      {`Available codes (${codes?.length})`}
                    </Typography>

                    <Stack maxHeight={400} sx={{ p: 1, overflowY: 'scroll' }}>
                      {codes?.map((inv) => (
                        <CodeOrAddressInvitationSection
                          codeOrAddress={inv.code}
                          count={inv.count}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <Box width={150}>
                    <Typography variant="caption" textAlign="start">
                      {`Pending invites (${pending?.length})`}
                    </Typography>
                    <Stack maxHeight={300} sx={{ p: 1, overflowY: 'scroll' }}>
                      {pending?.map((inv) => (
                        <CodeOrAddressInvitationSection codeOrAddress={inv.identity} />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
                <Box mt={5}>
                  <Typography variant="caption" textAlign="start">
                    {`Joined profiles (${joined?.length})`}
                  </Typography>
                  <Stack maxHeight={400} sx={{ p: 1, overflowY: 'scroll' }}>
                    {joined?.map(({ invitee }) => (
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
                          navigate(`/${invitee.username}`);
                        }}>
                        <ProfileSection maxWidth={150} profile={invitee} />
                        <Typography variant="caption">
                          joined on: {new Date(profile.createdDate).toLocaleDateString()}
                        </Typography>
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
