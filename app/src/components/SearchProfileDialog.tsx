import {
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  TextField,
  DialogTitle,
  InputAdornment,
  Box,
  Divider,
  Stack,
  Typography,
  Link,
  CircularProgress
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useState } from 'react';
import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { shortenWalletAddressLabel } from '../utils/address';
import { delay } from '../utils/delay';
//import { Link } from 'react-router-dom';

import { fetchQuery, useLazyQuery } from '@airstack/airstack-react';

export type SearchProfileDialogProps = DialogProps & CloseCallbackType;
const API_URL = import.meta.env.VITE_PAYFLOW_SERVICE_API_URL;
const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;

const querySocials = `query GetSocial($identity: Identity!) {
  Wallet(input: {identity: $identity, blockchain: ethereum}) {
    addresses
    primaryDomain {
      name
    }
    socials(input: {limit: 200}) {
      dappName
      profileName
      profileTokenId
    }
    xmtp {
      isXMTPEnabled
    }
  }
}`;

const queryAssociatedAddressesByFarcasterName = `query GetAssociatedAddresses($profileName: String!) {
  Socials(
    input: {filter: {profileName: {_eq: $profileName}}, blockchain: ethereum}
  ) {
    Social {
      userAssociatedAddresses
    }
  }
}`;

export default function SearchProfileDialog({
  closeStateCallback,
  ...props
}: SearchProfileDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function searchProfile(searchStr: string) {
    const searchValue = searchStr;
    if (searchValue) {
      setLoading(true);

      if (!searchValue.includes('.')) {
        const response = await axios.get(`${API_URL}/api/user/${searchValue}`, {
          withCredentials: true
        });
        const profile = (await response.data) as ProfileType;
        if (profile) {
          setProfiles([profile]);
        }
      } else {
        const domainId = searchValue.substring(searchValue.indexOf('.') + 1);
        if (domainId === 'eth') {
          const { data, error } = await fetchQuery(
            querySocials,
            { identity: searchStr },
            {
              cache: true
            }
          );

          if (data && data.Wallet.addresses[0]) {
            const response = await axios.get(`${API_URL}/api/user/${data.Wallet.addresses[0]}`, {
              withCredentials: true
            });
            const profile = (await response.data) as ProfileType;
            if (profile) {
              setProfiles([profile]);
            }
          }
        } else if (domainId === 'fc') {
          const { data, error } = await fetchQuery(
            queryAssociatedAddressesByFarcasterName,
            { profileName: searchStr.substring(0, searchStr.indexOf('.')) },
            {
              cache: true
            }
          );

          if (data) {
            const profileLoadingPromises: Promise<ProfileType>[] = (
              data.Socials.Social[0].userAssociatedAddresses as string[]
            ).map(async (address) => {
              const response = await axios.get(`${API_URL}/api/user/${address}`, {
                withCredentials: true
              });
              const profile = (await response.data) as ProfileType;
              return profile;
            });

            await Promise.all(profileLoadingPromises).then((profiles) => {
              setProfiles(profiles.filter((p) => p));
            });
          }
        } else if (domainId === 'lens') {
          toast.info('lens account search');
        }
      }

      setLoading(false);
    } else {
      setProfiles([]);
    }
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box>
          <TextField
            margin="normal"
            fullWidth
            label={'Search'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {!loading ? <Search /> : <CircularProgress color="inherit" size={25} />}
                </InputAdornment>
              ),
              inputProps: { maxLength: 42, inputMode: 'search' },
              sx: { borderRadius: 3 }
            }}
            onChange={async (event) => {
              await searchProfile(event.target.value);
            }}
          />
        </Box>
        <Divider orientation="horizontal" sx={{ mt: 2 }}></Divider>
      </DialogTitle>
      <DialogContent>
        <Stack m={1} spacing={1} height={400}>
          {profiles &&
            profiles.map((profile) => (
              <Link href={`${DAPP_URL}/p/${profile.username}`}>
                <Box
                  color="primary"
                  p={1}
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  //component={Link}
                  //to={`${DAPP_URL}/p/${profile.username}`}
                  sx={{ borderRadius: 3, border: 1, height: 60 }}>
                  <Typography>@{profile.username}</Typography>
                  <Typography>{shortenWalletAddressLabel(profile.address)}</Typography>
                </Box>
              </Link>
            ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
