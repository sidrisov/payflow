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
  Stack,
  Typography,
  CircularProgress,
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { ArrowBack, Clear, Menu, People, Star } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { IdentityType, SelectedIdentityType } from '../types/ProfleType';

import { Address } from 'viem';
import {
  searchProfile as searchIdentity,
  sortBySocialScore
} from '../services/socials';

import { useDebounce } from 'use-debounce';
import { WalletMenu } from './WalletMenu';
import { green, yellow } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { SearchProfileResultView } from './SearchProfileResultView';

export type SelectProfileResultCallbackType = {
  selectProfileCallback?: (selectedidentity: SelectedIdentityType) => void;
};

export type SetFavouriteCallbackType = {
  setFavouriteCallback?: ({
    identity,
    view,
    favourite
  }: {
    identity: IdentityType;
    view: 'address' | 'profile';
    favourite: boolean;
  }) => void;
};

export type SearchProfileDialogProps = DialogProps &
  CloseCallbackType &
  SelectProfileResultCallbackType &
  SetFavouriteCallbackType & {
    address?: Address;
    profileRedirect?: boolean;
    walletMenuEnabled?: boolean;
    addressBookEnabled?: boolean;
  };

// TODO: back button + title alignment hack - check with someone knowledgeable on proper solution
export default function SearchProfileDialog({
  address,
  profileRedirect,
  walletMenuEnabled,
  addressBookEnabled = false,
  closeStateCallback,
  selectProfileCallback,
  ...props
}: SearchProfileDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString?.replace(' ', ''), 500);

  const [foundProfiles, setFoundProfiles] = useState<IdentityType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const [addressBookView, setAddressBookView] = useState<'favourites' | 'friends'>('favourites');

  const [contactProfiles, setContactProfiles] = useState<IdentityType[]>([]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useMemo(async () => {
    if (debouncedSearchString && debouncedSearchString?.length > 1) {
      try {
        setLoading(true);
        // search among contacts
        let foundAmongContacts: IdentityType[] = [];
        if (contactProfiles?.length > 0) {
          // support different search criterias, e.g. if with fc search only among fc name, if lens, if eth...,
          // also if search by ens and result is found, skip online search
          foundAmongContacts = contactProfiles.filter(
            (c) =>
              c.profile?.username?.includes(debouncedSearchString) ||
              c.profile?.displayName?.includes(debouncedSearchString) ||
              c.meta?.ens?.includes(debouncedSearchString) ||
              c.meta?.socials?.find(
                (s) =>
                  s.profileDisplayName.includes(debouncedSearchString) ||
                  s.profileName.includes(debouncedSearchString)
              )
          );

          setFoundProfiles(foundAmongContacts);

          console.debug('Found among contacts: ', foundAmongContacts);
        }

        // general search
        const identities = await searchIdentity(debouncedSearchString, address);
        const addresses = identities.map((p) => p.address);

        const allFoundProfiles = sortBySocialScore(
          identities.concat(foundAmongContacts.filter((fc) => !addresses.includes(fc.address)))
        );

        console.debug('All found profiles:', allFoundProfiles);

        setFoundProfiles(allFoundProfiles);
      } finally {
        setLoading(false);
      }
    } else {
      setFoundProfiles([]);
    }
  }, [contactProfiles, debouncedSearchString, address]);

  useMemo(async () => {
    if (addressBookEnabled) {
      try {
        const response = await axios.get(`${API_URL}/api/user/me/contacts`, {
          withCredentials: true
        });

        if (response.status === 200) {
          const contactProfiles = response.data as IdentityType[];

          console.log('Contact profiles: ', contactProfiles);
          setContactProfiles(sortBySocialScore(contactProfiles));
        } else {
          setContactProfiles([]);
        }
      } catch (error) {
        console.error(error);
        setContactProfiles([]);
      }
    }
  }, [addressBookEnabled]);

  function updateFavourite(
    identity: IdentityType,
    view: 'address' | 'profile',
    favourite: boolean
  ) {
    console.log('I am here');
    const contact = contactProfiles?.find((c) => c.address === identity.address);
    let updatedContacts;

    if (contact) {
      updatedContacts = contactProfiles?.map((c) => {
        if (c.address === identity.address) {
          if (view === 'profile') {
            return { ...c, favouriteProfile: favourite };
          } else {
            return {
              ...c,
              favouriteAddress: favourite
            };
          }
        } else {
          return c;
        }
      });
    } else {
      // TODO: fix social conversion from search to contacts
      console.log('favourite from search');
      updatedContacts = [
        ...(contactProfiles ?? []),
        {
          address: identity.address,
          profile: identity.profile,
          favouriteAddress: view === 'address' ? true : undefined,
          favouriteProfile: view === 'profile' ? true : undefined
        } as IdentityType
      ];
    }

    setContactProfiles(updatedContacts);
  }

  const [shrink, setShrink] = useState(false);

  return (
    <Dialog
      fullScreen={isMobile}
      onClose={handleCloseCampaignDialog}
      sx={{
        backdropFilter: 'blur(5px)'
      }}
      PaperProps={{
        sx: {
          borderRadius: 5,
          minWidth: 350,
          ...(!isMobile && { minHeight: 500, maxHeight: 600 })
        }
      }}
      {...props}>
      <DialogTitle>
        <Stack>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent={
              walletMenuEnabled ? 'space-between' : isMobile ? 'flex-start' : 'center'
            }>
            <Stack direction="row" alignItems="center">
              {isMobile && (
                <IconButton onClick={closeStateCallback}>
                  <ArrowBack />
                </IconButton>
              )}
              <Typography ml={isMobile ? 2 : walletMenuEnabled ? 1 : 0} variant="h6">
                Search
              </Typography>
            </Stack>

            {walletMenuEnabled && (
              <IconButton
                color="inherit"
                onClick={async (event) => {
                  setWalletMenuAnchorEl(event.currentTarget);
                  setOpenWalletMenu(true);
                }}>
                <Menu />
              </IconButton>
            )}
          </Box>

          <TextField
            fullWidth
            margin="normal"
            label="search by name, fc:, lens:, .eth, or 0x"
            value={searchString ?? ''}
            InputProps={{
              startAdornment: shrink && (
                <InputAdornment position="start">
                  <Avatar src="payflow.png" sx={{ ml: 1, width: 28, height: 28 }} />
                </InputAdornment>
              ),
              endAdornment: debouncedSearchString && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={async () => {
                      setFoundProfiles([]);
                      setSearchString(undefined);
                      setShrink(false);
                    }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              inputProps: { maxLength: 42, inputMode: 'search' },
              sx: { borderRadius: 5 }
            }}
            onFocus={() => setShrink(true)}
            onBlur={(e) => setShrink(!!e.target.value)}
            InputLabelProps={{ shrink, margin: 'dense' }}
            onChange={async (event) => {
              setFoundProfiles([]);
              setSearchString(event.target.value);
            }}
          />
          {addressBookEnabled && !searchString && (
            <Stack my={1} spacing={1} direction="row" alignItems="center" alignSelf="center">
              <Chip
                clickable
                icon={<Star fontSize="small" />}
                label={
                  <Typography variant="caption" fontWeight="bold">
                    Favourites
                  </Typography>
                }
                sx={{
                  color: yellow.A700,
                  '& .MuiChip-icon': {
                    color: yellow.A700
                  },
                  backgroundColor: addressBookView === 'favourites' ? '' : 'inherit'
                }}
                onClick={async () => {
                  setAddressBookView('favourites');
                }}
              />
              <Chip
                clickable
                icon={<People fontSize="small" />}
                label={
                  <Typography variant="caption" fontWeight="bold">
                    People you know
                  </Typography>
                }
                sx={{
                  p: 1,
                  color: green.A700,
                  '& .MuiChip-icon': {
                    color: green.A700
                  },
                  backgroundColor: addressBookView === 'friends' ? '' : 'inherit'
                }}
                onClick={async () => {
                  setAddressBookView('friends');
                }}
              />
            </Stack>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ mb: 0.5 }}>
        <Box display="flex" flexDirection="column" alignContent="center">
          {addressBookEnabled &&
            !searchString &&
            (addressBookView === 'favourites'
              ? contactProfiles &&
                contactProfiles.length > 0 && (
                  <SearchProfileResultView
                    key={'search_profile_results_view_favourites'}
                    addressBookEnabled={addressBookEnabled}
                    profileRedirect={profileRedirect}
                    closeStateCallback={closeStateCallback}
                    selectProfileCallback={selectProfileCallback}
                    favourites={contactProfiles?.filter(
                      (c) => c.favouriteAddress || c.favouriteProfile
                    )}
                    setFavouriteCallback={({ identity: identity, view, favourite }) => {
                      updateFavourite(identity, view, favourite);
                    }}
                    profiles={contactProfiles.filter(
                      (identity) => identity.profile && identity.favouriteProfile
                    )}
                    addresses={contactProfiles.filter(
                      (identity) => identity.meta && identity.favouriteAddress
                    )}
                  />
                )
              : contactProfiles &&
                contactProfiles.length > 0 && (
                  <SearchProfileResultView
                    key={'search_profile_results_view_friends'}
                    addressBookEnabled={addressBookEnabled}
                    profileRedirect={profileRedirect}
                    closeStateCallback={closeStateCallback}
                    selectProfileCallback={selectProfileCallback}
                    favourites={contactProfiles?.filter(
                      (c) => c.favouriteAddress || c.favouriteProfile
                    )}
                    setFavouriteCallback={({ identity, view, favourite }) => {
                      updateFavourite(identity, view, favourite);
                    }}
                    profiles={contactProfiles.filter((identity) => identity.profile)}
                    addresses={contactProfiles.filter((identity) => identity.meta)}
                  />
                ))}

          <SearchProfileResultView
            key={'search_profile_results_view'}
            addressBookEnabled={addressBookEnabled}
            profileRedirect={profileRedirect}
            closeStateCallback={closeStateCallback}
            selectProfileCallback={selectProfileCallback}
            favourites={contactProfiles?.filter(
              (c) => c.favouriteAddress === true || c.favouriteProfile === true
            )}
            profiles={foundProfiles.filter((identity) => identity.profile)}
            setFavouriteCallback={({ identity, view, favourite }) => {
              updateFavourite(identity, view, favourite);
            }}
            addresses={foundProfiles.filter((identity) => identity.meta)}
          />

          {debouncedSearchString &&
            debouncedSearchString.length > 1 &&
            foundProfiles.length === 0 &&
            !loading && (
              <Typography alignSelf="center" variant="subtitle2">
                No results found.
              </Typography>
            )}
          {loading && (
            <Box m={1} alignSelf="center">
              <CircularProgress color="inherit" size={20} />
            </Box>
          )}
        </Box>
      </DialogContent>
      {walletMenuEnabled && (
        <WalletMenu
          anchorEl={walletMenuAnchorEl}
          open={openWalletMenu}
          onClose={() => setOpenWalletMenu(false)}
          closeStateCallback={() => setOpenWalletMenu(false)}
        />
      )}
    </Dialog>
  );
}
