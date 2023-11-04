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
  CircularProgress,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { Clear, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { shortenWalletAddressLabel } from '../utils/address';

import { fetchQuery } from '@airstack/airstack-react';
import { Address, isAddress } from 'viem';
import { useNavigate } from 'react-router-dom';

export type SelectProfileResultCallbackType = {
  selectProfileCallback?: (profile: Address | ProfileType) => void;
};

export type SearchProfileDialogProps = DialogProps &
  CloseCallbackType &
  SelectProfileResultCallbackType;
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

export default function SearchProfileDialog(props: SearchProfileDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchString, setSearchString] = useState<string>();
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { closeStateCallback, selectProfileCallback } = props;

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  const navigate = useNavigate();

  useMemo(async () => {
    if (searchString && searchString?.length > 2) {
      await searchProfile(searchString);
    }
  }, [searchString]);

  async function searchProfile(searchStr: string) {
    const searchValue = searchStr;
    if (searchValue) {
      setLoading(true);

      if (!searchValue.includes('.')) {
        const response = await axios.get(`${API_URL}/api/user?search=${searchValue}`, {
          withCredentials: true
        });
        const profiles = (await response.data) as ProfileType[];
        if (profiles) {
          setProfiles(profiles);
        } else {
          setProfiles([]);
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
            } else {
              setProfiles([]);
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
        <Box minWidth={300}>
          <TextField
            fullWidth
            margin="normal"
            label="Search"
            value={searchString ?? ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {!loading ? <Search /> : <CircularProgress color="inherit" size={25} />}
                </InputAdornment>
              ),
              endAdornment: searchString && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={async () => {
                      setSearchString(undefined);
                      setProfiles([]);
                    }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              inputProps: { maxLength: 42, inputMode: 'search' },
              sx: { borderRadius: 3 }
            }}
            onChange={async (event) => {
              setSearchString(event.target.value);
            }}
          />
        </Box>
        <Divider orientation="horizontal" sx={{ mt: 2 }}></Divider>
      </DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          minHeight={300}
          maxHeight={500}>
          {selectProfileCallback && searchString && isAddress(searchString) && (
            <>
              <Typography variant="subtitle2">Address</Typography>

              <Box
                m={1}
                color="inherit"
                p={1}
                display="flex"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                component={Button}
                textTransform="none"
                sx={{ borderRadius: 3, border: 1, height: 60 }}
                onClick={async () => {
                  if (selectProfileCallback) {
                    selectProfileCallback(searchString);
                  }
                  closeStateCallback();
                }}>
                <Typography>{shortenWalletAddressLabel(searchString)}</Typography>
              </Box>
            </>
          )}

          {profiles && profiles.length > 0 && (
            <>
              <Typography variant="subtitle2">Profiles</Typography>

              <Stack m={1} spacing={1}>
                {profiles.map((profile) => (
                  <Box
                    color="inherit"
                    p={1}
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    component={Button}
                    textTransform="none"
                    sx={{ borderRadius: 3, border: 0, height: 60 }}
                    onClick={async () => {
                      if (selectProfileCallback) {
                        selectProfileCallback(profile);
                      } else {
                        navigate(`/${profile.username}`);
                      }
                      closeStateCallback();
                    }}>
                    <Typography>@{profile.username}</Typography>
                    <Chip
                      size="small"
                      variant="filled"
                      label="payflow"
                      sx={{ background: 'lightgreen' }}
                    />
                  </Box>
                ))}
              </Stack>
            </>
          )}
          {searchString &&
            profiles.length === 0 &&
            selectProfileCallback &&
            !isAddress(searchString) && (
              <Typography alignSelf="center" variant="subtitle2">
                No results found.
              </Typography>
            )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
