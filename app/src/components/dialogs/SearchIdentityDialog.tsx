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
  Avatar
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { ArrowBack, Clear, Menu } from '@mui/icons-material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IdentityType, SelectedIdentityType } from '../../types/ProfleType';

import { Address } from 'viem';
import { searchIdentity, sortBySocialScore } from '../../services/socials';

import { useDebounce } from 'use-debounce';
import { WalletMenu } from '../menu/WalletMenu';
import { SearchResultView } from '../SearchResultView';
import { FARCASTER_DAPP, LENS_DAPP } from '../../utils/dapps';
import { ProfileContext } from '../../contexts/UserContext';
import { AddressBookType } from '../../types/ContactType';
import { identitiesInvited } from '../../services/invitation';
import { AddressBookToolBar } from '../chips/AddressBookChip';
import { useContacts } from '../../utils/queries/contacts';

export type SelectIdentityCallbackType = {
  selectIdentityCallback?: (selectedIdentity: SelectedIdentityType) => void;
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
  SelectIdentityCallbackType &
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
  selectIdentityCallback,
  ...props
}: SearchIdentityDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated } = useContext(ProfileContext);

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString?.replace(' ', '').toLowerCase(), 500, {
    leading: true,
    trailing: true,
    maxWait: 5000
  });

  const [foundIdentities, setFoundIdentities] = useState<IdentityType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const [addressBookView, setAddressBookView] = useState<AddressBookType>('favourites');

  const { isFetching: isFetchingContacts, data } = useContacts(isAuthenticated);

  const [contacts, setContacts] = useState<IdentityType[]>([]);

  const [shrink, setShrink] = useState(false);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useEffect(() => {
    console.log('Is fetching contacts', isFetchingContacts);
    if (!isFetchingContacts && data) {
      setContacts(data);
    }
  }, [data, isFetchingContacts]);

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
              c.profile?.displayName?.toLowerCase().includes(debouncedSearchString) ||
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
                  s.profileDisplayName.toLowerCase().includes(socialSearchStr) ||
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
          const addresses = foundAmongContacts.map((p) => p.address);

          // general search
          const identities = (await searchIdentity(debouncedSearchString, address)).filter(
            (fi) => !addresses.includes(fi.address)
          );

          if (identities.length > 0 && isAuthenticated) {
            const inviteStatuses = await identitiesInvited(
              identities.map((identity) => identity.address)
            );

            // Update identities in a single pass:
            identities.forEach((identity) => {
              identity.invited = inviteStatuses[identity.address];
            });
          }

          const allFoundProfiles = sortBySocialScore(foundAmongContacts.concat(identities));
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


  const updateIdentityCallback = ({
    identity,
    view,
    favourite,
    invited
  }: {
    identity: IdentityType;
    view: 'address' | 'profile';
    favourite?: boolean | undefined;
    invited?: boolean | undefined;
  }) => {
    updateIdentity(identity, view, favourite, invited);
  };

  function updateIdentity(
    identity: IdentityType,
    view: 'address' | 'profile',
    favourite?: boolean,
    invited?: boolean
  ) {
    const contact = contacts.find((c) => c.address === identity.address);
    let updatedContacts;

    console.log('Updating identity', identity.address, view, favourite, invited, identity);

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

  return (
    <Dialog
      fullScreen={isMobile}
      onClose={handleCloseCampaignDialog}
      sx={{
        backdropFilter: 'blur(5px)'
      }}
      PaperProps={{
        sx: {
          ...(!isMobile && { width: 375, height: 600, borderRadius: 5 })
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
            <AddressBookToolBar
              addressBookView={addressBookView}
              setAddressBookView={setAddressBookView}
            />
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
                selectIdentityCallback={selectIdentityCallback}
                updateIdentityCallback={updateIdentityCallback}
                filterByFafourites={true}
                identities={contacts.filter((c) => c.tags?.includes('user-contacts'))}
              />
            ) : addressBookView === 'friends' ? (
              <SearchResultView
                key={'search_identity_friends_view'}
                profileRedirect={profileRedirect}
                closeStateCallback={closeStateCallback}
                selectIdentityCallback={selectIdentityCallback}
                updateIdentityCallback={updateIdentityCallback}
                identities={contacts.filter((c) => c.tags?.includes('user-contacts'))}
              />
            ) : (
              <SearchResultView
                key={'search_identity_eth_denver_view'}
                insightsEnabled={false}
                profileRedirect={profileRedirect}
                closeStateCallback={closeStateCallback}
                selectIdentityCallback={selectIdentityCallback}
                updateIdentityCallback={updateIdentityCallback}
                identities={contacts.filter((c) => c.tags?.includes('eth-denver-contacts'))}
              />
            ))}

          <SearchResultView
            key={'search_identity_results_view'}
            profileRedirect={profileRedirect}
            closeStateCallback={closeStateCallback}
            selectIdentityCallback={selectIdentityCallback}
            identities={foundIdentities}
            updateIdentityCallback={updateIdentityCallback}
          />

          {debouncedSearchString &&
            debouncedSearchString.length > 1 &&
            foundIdentities.length === 0 &&
            !loading && (
              <Typography alignSelf="center" variant="subtitle2">
                No results found.
              </Typography>
            )}

          {isAuthenticated && contacts.length === 0 && !isFetchingContacts && (
            <Typography alignSelf="center" variant="subtitle2">
              No results found.
            </Typography>
          )}

          {(loading || isFetchingContacts) && (
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
