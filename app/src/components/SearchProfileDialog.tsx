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
import { ProfileWithSocialsType, SelectedProfileWithSocialsType } from '../types/ProfleType';

import { Address, isAddress } from 'viem';
import { searchProfile, sortBySocialScore } from '../services/socials';

import { useDebounce } from 'use-debounce';
import { WalletMenu } from './WalletMenu';
import { green, yellow } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { FavouriteType } from '../types/FavouriteType';
import { SearchProfileResultView } from './SearchProfileResultView';

export type SelectProfileResultCallbackType = {
  selectProfileCallback?: (selectedProfileWithSocials: SelectedProfileWithSocialsType) => void;
};

export type SearchProfileDialogProps = DialogProps &
  CloseCallbackType &
  SelectProfileResultCallbackType & {
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

  const [profiles, setProfiles] = useState<ProfileWithSocialsType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const [addressBookView, setAddressBookView] = useState<'favourites' | 'friends'>('favourites');

  const [contacts, setContacts] = useState<FavouriteType[]>();
  const [contactProfiles, setContactProfiles] = useState<ProfileWithSocialsType[]>([]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useMemo(async () => {
    if (debouncedSearchString && debouncedSearchString?.length > 1) {
      try {
        setLoading(true);
        const profiles = sortBySocialScore(await searchProfile(debouncedSearchString, address));
        setProfiles(profiles);
      } finally {
        setLoading(false);
      }
    } else {
      setProfiles([]);
    }
  }, [debouncedSearchString, address]);

  useMemo(() => {
    if (contacts && contacts.length > 0) {
      let contactProfiles: ProfileWithSocialsType[] = [];
      const promises = contacts.map(async (f) => await searchProfile(f.identity, address));

      Promise.all(promises).then((results) => {
        results.forEach((socials) => {
          contactProfiles = contactProfiles.concat(socials);
        });
        setContactProfiles(sortBySocialScore(contactProfiles));
      });
    } else {
      setContactProfiles([]);
    }
  }, [contacts?.length]);

  useMemo(async () => {
    if (addressBookEnabled) {
      try {
        const response = await axios.get(`${API_URL}/api/user/me/contacts`, {
          withCredentials: true
        });

        if (response.status === 200) {
          setContacts(response.data as FavouriteType[]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [addressBookEnabled]);

  const [shrink, setShrink] = useState(false);

  return (
    <Dialog
      fullScreen={isMobile}
      onClose={handleCloseCampaignDialog}
      sx={{
        backdropFilter: 'blur(5px)'
      }}
      PaperProps={{ sx: { borderRadius: 5 } }}
      {...props}>
      <DialogTitle>
        <Stack minWidth={300}>
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
                      setProfiles([]);
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
              setProfiles([]);
              setSearchString(event.target.value);
            }}
          />
          {addressBookEnabled && !searchString && (
            <Stack my={1} spacing={1} direction="row" alignItems="center">
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
      <DialogContent>
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          minHeight={300}
          maxHeight={500}>
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
                    favourites={contacts?.filter((c) => c.addressChecked || c.profileChecked)}
                    profiles={contactProfiles.filter(
                      (profileWithSocials) =>
                        profileWithSocials.profile &&
                        contacts?.find(
                          (f) =>
                            f.identity.toLowerCase() ===
                            profileWithSocials.profile?.identity.toLowerCase()
                        )?.profileChecked
                    )}
                    addresses={contactProfiles.filter(
                      (profileWithSocials) =>
                        profileWithSocials.meta &&
                        contacts?.find((f) => f.identity === profileWithSocials.meta?.addresses[0])
                          ?.addressChecked
                    )}
                  />
                )
              : contactProfiles &&
                contactProfiles.length > 0 && (
                  <SearchProfileResultView
                    key={'search_profile_results_view_favourites'}
                    addressBookEnabled={addressBookEnabled}
                    profileRedirect={profileRedirect}
                    closeStateCallback={closeStateCallback}
                    selectProfileCallback={selectProfileCallback}
                    favourites={contacts?.filter((c) => c.addressChecked || c.profileChecked)}
                    profiles={contactProfiles.filter(
                      (profileWithSocials) => profileWithSocials.profile
                    )}
                    addresses={contactProfiles.filter(
                      (profileWithSocials) => profileWithSocials.meta
                    )}
                  />
                ))}

          <SearchProfileResultView
            key={'search_profile_results_view'}
            addressBookEnabled={addressBookEnabled}
            profileRedirect={profileRedirect}
            closeStateCallback={closeStateCallback}
            selectProfileCallback={selectProfileCallback}
            favourites={contacts?.filter(
              (c) => c.addressChecked === true || c.profileChecked === true
            )}
            profiles={profiles.filter((profileWithSocials) => profileWithSocials.profile)}
            addresses={
              searchString &&
              (isAddress(searchString) ||
                searchString.endsWith('.eth') ||
                searchString.endsWith('.xyz') ||
                searchString.endsWith('.id') ||
                searchString.startsWith('fc:') ||
                searchString.startsWith('lens:'))
                ? profiles.filter((profileWithSocials) => profileWithSocials.meta)
                : []
            }
          />

          {debouncedSearchString &&
            debouncedSearchString.length > 1 &&
            profiles.length === 0 &&
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
