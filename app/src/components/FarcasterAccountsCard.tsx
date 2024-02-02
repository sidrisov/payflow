import { Box, Button, Card, CardProps, Stack, Typography } from '@mui/material';
import { StatusAPIResponse } from '@farcaster/auth-kit';

import { useMemo, useState } from 'react';
import { API_URL } from '../utils/urlConstants';
import { ParsedMessage } from '@spruceid/siwe-parser';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Address } from 'viem';
import { sortBySocialScore } from '../services/socials';
import { IdentityType } from '../types/ProfleType';
import LoadingButton from '@mui/lab/LoadingButton';
import { LoadingFarcasterAccountsSkeleton } from './LoadingFarcasterAccountsSkeleton';
import { FarcasterIdentitySelectOption } from './FarcasterIdentitySelectOption';

export function FarcasterAccountsCard({
  siwfResponse,
  ...props
}: {
  siwfResponse: StatusAPIResponse;
} & CardProps) {
  let verifications: Address[] = [
    ...((siwfResponse.verifications as Address[]) ?? []),
    siwfResponse.custody as Address
  ];

  const [loading, setLoading] = useState<boolean>();
  const [identities, setIdentities] = useState<IdentityType[]>();
  const [signUpIdentity, setSignUpIdentity] = useState<Address>();

  useMemo(async () => {
    if (verifications) {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/user/identities`, {
          params: { identities: verifications },
          paramsSerializer: {
            indexes: null
          }
        });
        setIdentities(sortBySocialScore(response.data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, [verifications.length]);

  console.log(identities);

  const navigate = useNavigate();

  async function completeSignUp() {
    if (siwfResponse != null) {
      console.debug('onFarcasterSignInSuccess: ', siwfResponse);
      if (siwfResponse.message && siwfResponse.signature && siwfResponse.state === 'completed') {
        const parsedMessage = new ParsedMessage(siwfResponse.message);
        const signature = siwfResponse.signature;
        const verifications = siwfResponse.verifications;
        console.debug(parsedMessage, signature, verifications);

        try {
          const response = await axios.post(
            `${API_URL}/api/auth/verify/${signUpIdentity}`,
            { message: parsedMessage, signature },
            { withCredentials: true }
          );

          if (response.status === 200) {
            navigate('/');
          } else {
            toast.error('Failed to sign in with Farcaster');
          }
        } catch (error) {
          toast.error('Failed to sign in with Farcaster');
          console.error(error);
        }
      }
    }
  }

  return (
    <Card
      {...props}
      elevation={5}
      sx={{
        m: 2,
        p: 3,
        border: 1.5,
        borderRadius: 5,
        borderColor: 'divider',
        width: 360,
        height: 500,
        display: 'flex',
        flexDirection: 'column'
      }}>
      <Typography variant="h6" textAlign="center">
        Select Profile Identity
      </Typography>
      <Typography variant="subtitle2" textAlign="center">
        farcaster connected addresses
      </Typography>
      <Box
        height="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between">
        <Stack
          spacing={2}
          alignItems="center"
          sx={{ my: 3, py: 1, overflowY: 'auto', height: 275, width: '100%' }}>
          {loading ? (
            <LoadingFarcasterAccountsSkeleton />
          ) : identities && identities.length > 0 ? (
            identities.map((identity) => (
              <Box
                component={Button}
                onClick={async () => setSignUpIdentity(identity.address)}
                sx={{
                  height: 75,
                  width: '100%',
                  textTransform: 'none',
                  color: 'inherit',
                  border: 1.5,
                  borderRadius: 5,
                  borderColor: identity.address === signUpIdentity ? 'inherit' : 'divider',
                  borderStyle: identity.address === signUpIdentity ? 'dashed' : 'solid'
                }}>
                <FarcasterIdentitySelectOption identity={identity} />
              </Box>
            ))
          ) : (
            <Typography variant="caption" fontWeight="bold">
              No connected accounts found
            </Typography>
          )}
        </Stack>
        <LoadingButton
          fullWidth
          disabled={!signUpIdentity}
          variant="outlined"
          loading={false}
          size="large"
          color="inherit"
          onClick={completeSignUp}
          sx={{ my: 1, px: 1, borderRadius: 5 }}>
          Continue
        </LoadingButton>
      </Box>
    </Card>
  );
}
