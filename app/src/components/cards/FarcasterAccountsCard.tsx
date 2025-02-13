import { Box, Button, Card, CardProps, Stack, Typography } from '@mui/material';

import { useEffect, useState, useMemo } from 'react';
import { API_URL } from '../../utils/urlConstants';
import { parseSiweMessage } from 'viem/siwe';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Address } from 'viem';
import { sortBySocialScore } from '../../services/socials';
import { ContactType, IdentityType } from '@payflow/common';
import LoadingButton from '@mui/lab/LoadingButton';
import { LoadingFarcasterAccountsSkeleton } from '../skeletons/LoadingFarcasterAccountsSkeleton';
import { FarcasterIdentitySelectOption } from '../FarcasterIdentitySelectOption';

export function FarcasterAccountsCard({
  username,
  fid,
  message,
  signature,
  ...props
}: {
  username?: string;
  fid: number;
  message: string;
  signature: string;
} & CardProps) {
  const [loading, setLoading] = useState<boolean>();
  const [identities, setIdentities] = useState<IdentityType[]>();
  const [signUpIdentity, setSignUpIdentity] = useState<Address>();
  const [loadingVerify, setLoadingVerify] = useState<boolean>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    async function fetchIdentities() {
      if (fid) {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/api/user/identities`, {
            params: { fid },
            paramsSerializer: {
              indexes: null
            }
          });
          const sortedIdentities = sortBySocialScore(
            (response.data as IdentityType[]).map((i) => ({ data: i }) as ContactType)
          ).map((contact) => contact.data);

          setIdentities(sortedIdentities);

          const withProfile = sortedIdentities.find((identity) => identity.profile);
          if (withProfile) {
            setSignUpIdentity(withProfile.address);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchIdentities();
  }, [fid]);

  const filteredIdentities = useMemo(() => {
    if (!identities?.length) return [];
    return identities.some((identity) => identity.profile)
      ? identities.filter((identity) => identity.profile)
      : identities;
  }, [identities]);

  async function completeSignUp() {
    console.debug('onFarcasterSignInSuccess: ', message, signature);
    const parsedMessage = parseSiweMessage(message);

    try {
      setLoadingVerify(true);
      const response = await axios.post(
        `${API_URL}/api/auth/verify/${signUpIdentity}`,
        { message: parsedMessage, signature },
        { withCredentials: true }
      );

      if (response.status === 200) {
        console.debug('redirecting to: ', redirect ?? '/');
        navigate(redirect ?? '/');
      } else {
        toast.error('Failed to sign in with Farcaster');
      }
    } catch (error) {
      toast.error('Failed to sign in with Farcaster');
      console.error(error);
    } finally {
      setLoadingVerify(false);
    }
  }

  return (
    <Card
      {...props}
      elevation={5}
      sx={{
        m: 2,
        p: 3,
        borderRadius: 5,
        width: 360,
        maxHeight: 550,
        display: 'flex',
        flexDirection: 'column'
      }}>
      <Typography variant="h6" textAlign="center">
        Welcome, @{username}
      </Typography>

      {!loading && (
        <Typography
          variant="body2"
          textAlign="center"
          color="text.secondary"
          sx={{ mt: 0.5, textWrap: 'balance' }}>
          {identities?.length === 0
            ? 'You have no verified addresses. Please verify your wallet address in Warpcast first.'
            : identities?.some((identity) => identity.profile)
              ? 'Select a profile to continue'
              : 'Select an address to create profile'}
        </Typography>
      )}

      <Box
        height="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between">
        <Stack spacing={1} sx={{ p: 2, overflowY: 'scroll', height: 275, width: '100%' }}>
          {loading ? (
            <LoadingFarcasterAccountsSkeleton />
          ) : (
            <>
              {filteredIdentities.map((identity) => (
                <Box
                  key={identity.address}
                  component={Button}
                  onClick={() => setSignUpIdentity(identity.address)}
                  sx={{
                    height: 75,
                    width: '100%',
                    textTransform: 'none',
                    color: 'inherit',
                    border: 1,
                    borderRadius: 5,
                    borderColor: identity.address === signUpIdentity ? 'primary.main' : 'divider',
                    borderStyle: identity.profile ? 'solid' : 'dashed',
                    bgcolor: identity.address === signUpIdentity ? 'action.selected' : 'transparent'
                  }}>
                  <FarcasterIdentitySelectOption identity={identity} />
                </Box>
              ))}
            </>
          )}
        </Stack>

        {identities && identities.length > 0 ? (
          <LoadingButton
            fullWidth
            disabled={!signUpIdentity}
            variant="contained"
            loading={loadingVerify}
            size="large"
            onClick={completeSignUp}>
            {!identities?.some((identity) => identity.profile)
              ? 'Create Profile'
              : signUpIdentity
                ? 'Continue'
                : 'Select a profile'}
          </LoadingButton>
        ) : (
          <Button
            fullWidth
            variant="contained"
            size="large"
            href="https://warpcast.com/~/settings/verified-addresses"
            target="_blank">
            Verify in Warpcast
          </Button>
        )}
      </Box>
    </Card>
  );
}
