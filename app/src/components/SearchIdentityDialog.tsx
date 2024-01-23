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
import { useContext, useMemo, useState } from 'react';
import { IdentityType, SelectedIdentityType } from '../types/ProfleType';

import { Address } from 'viem';
import { searchProfile as searchIdentity, sortBySocialScore } from '../services/socials';

import { useDebounce } from 'use-debounce';
import { WalletMenu } from './WalletMenu';
import { green, yellow } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { SearchResultView } from './SearchResultView';
import { FARCASTER_DAPP, LENS_DAPP } from '../utils/dapps';
import { ProfileContext } from '../contexts/UserContext';

export type SelectProfileResultCallbackType = {
  selectProfileCallback?: (selectedidentity: SelectedIdentityType) => void;
};

export type UpdateIdentityCallbackType = {
  updateIdentityCallback?: ({
    identity,
    view,
    favourite,
    invited
  }: {
    identity: IdentityType;
    view: 'address' | 'profile';
    favourite?: boolean;
    invited?: boolean;
  }) => void;
};

export type SearchIdentityDialogProps = DialogProps &
  CloseCallbackType &
  SelectProfileResultCallbackType &
  UpdateIdentityCallbackType & {
    address?: Address;
    profileRedirect?: boolean;
    walletMenuEnabled?: boolean;
  };

// TODO: back button + title alignment hack - check with someone knowledgeable on proper solution
export default function SearchIdentityDialog({
  address,
  profileRedirect,
  walletMenuEnabled,
  closeStateCallback,
  selectProfileCallback,
  ...props
}: SearchIdentityDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated } = useContext(ProfileContext);

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString?.replace(' ', ''), 500);

  const [foundIdentities, setFoundIdentities] = useState<IdentityType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const [addressBookView, setAddressBookView] = useState<'favourites' | 'friends'>('favourites');

  const [contacts, setContacts] = useState<IdentityType[]>([]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useMemo(async () => {
    if (debouncedSearchString && debouncedSearchString?.length > 1) {
      try {
        setLoading(true);
        // search among contacts
        let foundAmongContacts: IdentityType[] = [];
        if (contacts?.length > 0) {
          // support different search criterias, e.g. if with fc search only among fc name, if lens, if eth...,
          // also if search by ens and result is found, skip online search
          foundAmongContacts = contacts.filter(
            (c) =>
              c.profile?.username?.includes(debouncedSearchString) ||
              c.profile?.displayName?.includes(debouncedSearchString) ||
              c.meta?.ens?.includes(debouncedSearchString) ||
              c.meta?.socials?.find((s) => {
                let socialSearchStr = debouncedSearchString;

                if (
                  (s.dappName === FARCASTER_DAPP && debouncedSearchString.startsWith('fc:')) ||
                  (s.dappName === LENS_DAPP && debouncedSearchString.startsWith('lens:'))
                ) {
                  socialSearchStr = socialSearchStr.substring(socialSearchStr.indexOf(':') + 1);
                }

                return (
                  s.profileDisplayName.includes(socialSearchStr) ||
                  s.profileName.includes(socialSearchStr)
                );
              })
          );

          setFoundIdentities(foundAmongContacts);
          console.debug('Found among contacts: ', foundAmongContacts);
        }

        // todo fetch invited list

        // skip search if we have 5 results
        if (foundAmongContacts.length <= 5) {
          // general search
          const identities = await searchIdentity(debouncedSearchString, address);
          const addresses = foundAmongContacts.map((p) => p.address);

          const allFoundProfiles = sortBySocialScore(
            foundAmongContacts.concat(identities.filter((fi) => !addresses.includes(fi.address)))
          );
          console.debug('All found profiles:', allFoundProfiles);
          setFoundIdentities(allFoundProfiles);
        }
      } finally {
        setLoading(false);
      }
    } else {
      setFoundIdentities([]);
    }
  }, [debouncedSearchString, address]);

  useMemo(async () => {
    if (isAuthenticated) {
      try {
        const response = await axios.get(`${API_URL}/api/user/me/contacts`, {
          withCredentials: true
        });

        if (response.status === 200) {
          const contacts = response.data as IdentityType[];

          console.log('Contact profiles: ', contacts);
          setContacts(sortBySocialScore(contacts));
        } else {
          setContacts([]);
        }
      } catch (error) {
        console.error(error);
        setContacts([]);
      }
    }
  }, [isAuthenticated]);

  function updateIdentity(
    identity: IdentityType,
    view: 'address' | 'profile',
    favourite?: boolean,
    invited?: boolean
  ) {
    const contact = contacts.find((c) => c.address === identity.address);
    let updatedContacts;

    console.log(identity, view, favourite, invited);

    if (contact) {
      // updating identity from address book
      updatedContacts = contacts.map((c) => {
        if (c.address === identity.address) {
          return {
            ...c,
            ...(favourite !== undefined &&
              (view === 'profile'
                ? { favouriteProfile: favourite }
                : { favouriteAddress: favourite })),
            ...(invited !== undefined && { invited: true })
          };
        } else {
          return c;
        }
      });
    } else {
      // updating identity from search result
      console.log('favourite from search');
      updatedContacts = [
        ...contacts,
        {
          ...identity,
          ...(favourite !== undefined &&
            (view === 'profile'
              ? { favouriteProfile: favourite }
              : { favouriteAddress: favourite })),
          ...(invited !== undefined && { invited: true })
        }
      ];
    }

    setContacts(updatedContacts);

    const identities = foundIdentities.map((fi) => {
      if (fi.address === identity.address) {
        return {
          ...fi,
          ...(favourite !== undefined &&
            (view === 'profile'
              ? { favouriteProfile: favourite }
              : { favouriteAddress: favourite })),
          ...(invited !== undefined && { invited: true })
        };
      } else {
        return fi;
      }
    });

    setFoundIdentities(identities);
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
          ...(!isMobile && { width: 375, height: 600 })
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
                      setFoundIdentities([]);
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
              setFoundIdentities([]);
              setSearchString(event.target.value);
            }}
          />
          {isAuthenticated && !searchString && (
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
          {isAuthenticated &&
            !searchString &&
            contacts.length > 0 &&
            (addressBookView === 'favourites' ? (
              <SearchResultView
                key={'search_identity_favourites_view'}
                profileRedirect={profileRedirect}
                closeStateCallback={closeStateCallback}
                selectProfileCallback={selectProfileCallback}
                updateIdentityCallback={({ identity, view, favourite, invited }) => {
                  updateIdentity(identity, view, favourite, invited);
                }}
                filterByFafourites={true}
                identities={contacts}
              />
            ) : (
              <SearchResultView
                key={'search_identity_friends_view'}
                profileRedirect={profileRedirect}
                closeStateCallback={closeStateCallback}
                selectProfileCallback={selectProfileCallback}
                updateIdentityCallback={({ identity, view, favourite, invited }) => {
                  updateIdentity(identity, view, favourite, invited);
                }}
                identities={contacts}
              />
            ))}

          <SearchResultView
            key={'search_identity_results_view'}
            profileRedirect={profileRedirect}
            closeStateCallback={closeStateCallback}
            selectProfileCallback={selectProfileCallback}
            identities={foundIdentities}
            updateIdentityCallback={({ identity, view, favourite, invited }) => {
              updateIdentity(identity, view, favourite, invited);
            }}
          />

          {debouncedSearchString &&
            debouncedSearchString.length > 1 &&
            foundIdentities.length === 0 &&
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
