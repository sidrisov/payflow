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
import { ContactType, SelectedIdentityType } from '../../types/ProfileType';

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
import { useSearchParams } from 'react-router-dom';

export type SelectIdentityCallbackType = {
  selectIdentityCallback?: (selectedIdentity: SelectedIdentityType) => void;
};

export type UpdateIdentityCallbackType = {
  updateIdentityCallback?: ({ contact }: { contact: ContactType }) => void;
};

export type SearchIdentityDialogProps = DialogProps &
  CloseCallbackType &
  SelectIdentityCallbackType &
  UpdateIdentityCallbackType & {
    address?: Address;
    profileRedirect?: boolean;
    walletMenuEnabled?: boolean;
  } & { hideBackButton?: boolean; showOnTopOfNavigation?: boolean };

// TODO: back button + title alignment hack - check with someone knowledgeable on proper solution
export default function SearchIdentityDialog({
  address,
  profileRedirect,
  walletMenuEnabled,
  closeStateCallback,
  selectIdentityCallback,
  title,
  showOnTopOfNavigation = true,
  hideBackButton = false,
  ...props
}: SearchIdentityDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('access_token') ?? undefined;

  const { isAuthenticated } = useContext(ProfileContext);

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString?.replace(' ', '').toLowerCase(), 500, {
    leading: true,
    trailing: true,
    maxWait: 5000
  });

  const [foundIdentities, setFoundIdentities] = useState<ContactType[]>([]);
  const [isSearchingContacts, setSearchingContacts] = useState<boolean>(false);

  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const [addressBookView, setAddressBookView] = useState<AddressBookType>('all');

  const { isFetching: isFetchingContacts, data } = useContacts({
    enabled: isAuthenticated,
    accessToken: accessToken
  });

  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [shrink, setShrink] = useState(false);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useEffect(() => {
    console.log('Is fetching contacts', isFetchingContacts);
    if (!isFetchingContacts && data) {
      setTags(data.tags);
      setContacts(data.contacts);
    }
  }, [data, isFetchingContacts]);

  useMemo(async () => {
    if (debouncedSearchString && debouncedSearchString?.length > 1) {
      try {
        setSearchingContacts(true);
        // search among contacts
        let foundAmongContacts: ContactType[] = [];
        if (contacts?.length > 0) {
          // support different search criterias, e.g. if with fc search only among fc name, if lens, if eth...,
          // also if search by ens and result is found, skip online search
          foundAmongContacts = contacts.filter(
            (c) =>
              (addressBookView !== 'all' ? c.tags?.includes(addressBookView) : true) &&
              (c.data.profile?.username?.includes(debouncedSearchString) ||
                c.data.profile?.displayName?.toLowerCase().includes(debouncedSearchString) ||
                c.data.meta?.ens?.includes(debouncedSearchString) ||
                c.data.meta?.socials?.find((s) => {
                  let socialSearchStr = debouncedSearchString;

                  if (
                    (s.dappName === FARCASTER_DAPP && debouncedSearchString.startsWith('@fname')) ||
                    (s.dappName === LENS_DAPP && debouncedSearchString.startsWith('lens:'))
                  ) {
                    socialSearchStr = socialSearchStr.substring(socialSearchStr.indexOf(':') + 1);
                  }

                  return (
                    s.profileDisplayName.toLowerCase().includes(socialSearchStr) ||
                    s.profileName.includes(socialSearchStr)
                  );
                }) ||
                c.tags?.find((tag) => tag.includes(debouncedSearchString)))
          );

          setFoundIdentities(foundAmongContacts);
          console.debug('Found among contacts: ', foundAmongContacts);
        }

        // skip search if we have 5 results and its all tab
        if (foundAmongContacts.length <= 5 && addressBookView === 'all') {
          const addresses = foundAmongContacts.map((p) => p.data.address);

          // general search
          const identities = (await searchIdentity(debouncedSearchString, address)).filter(
            (fi) => !addresses.includes(fi.data.address)
          );

          if (identities.length > 0 && isAuthenticated) {
            const inviteStatuses = await identitiesInvited(
              identities.map((identity) => identity.data.address),
              accessToken
            );

            // Update identities in a single pass:
            identities.forEach((identity) => {
              identity.data.invited = inviteStatuses[identity.data.address];
            });
          }

          const allFoundProfiles = sortBySocialScore(foundAmongContacts.concat(identities));
          console.debug('All found profiles:', allFoundProfiles);
          setFoundIdentities(allFoundProfiles);
        }
      } finally {
        setSearchingContacts(false);
      }
    } else {
      setFoundIdentities([]);
    }
  }, [debouncedSearchString, address, addressBookView]);

  const updateIdentityCallback = ({ contact }: { contact: ContactType }) => {
    updateIdentity(contact);
  };

  function updateIdentity(identity: ContactType) {
    const contact = contacts.find((c) => c.data.address === identity.data.address);
    let updatedContacts;

    console.log('Updating identity', identity.data.address, identity);

    if (contact) {
      // updating identity from address book
      updatedContacts = contacts.map((c) => {
        if (c.data.address === identity.data.address) {
          return {
            ...identity
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
          ...identity
        }
      ];
    }

    setContacts(updatedContacts);

    const identities = foundIdentities.map((fi) => {
      if (fi.data.address === identity.data.address) {
        return {
          ...identity
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
        ...(showOnTopOfNavigation && { zIndex: 1550 }),
        backdropFilter: 'blur(5px)'
      }}
      PaperProps={{
        sx: {
          ...(!isMobile && { width: 425, height: 650, borderRadius: 5 })
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
              walletMenuEnabled
                ? 'space-between'
                : isMobile && !hideBackButton
                ? 'flex-start'
                : 'center'
            }>
            <Stack direction="row" alignItems="center" width="100%">
              {isMobile && !hideBackButton && (
                <IconButton onClick={closeStateCallback}>
                  <ArrowBack />
                </IconButton>
              )}
              <TextField
                fullWidth
                margin="dense"
                label="search by name, @fname, lens:, .eth, 0x"
                type="text"
                value={searchString ?? ''}
                InputProps={{
                  startAdornment: shrink && (
                    <InputAdornment position="start">
                      <Avatar src="payflow.png" sx={{ ml: 1, width: 28, height: 28 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchString && (
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
                  inputProps: { maxLength: 42 },
                  sx: {
                    borderRadius: 5,
                    maxHeight: 50
                  }
                }}
                onFocus={() => setShrink(true)}
                onBlur={(e) => setShrink(!!e.target.value)}
                InputLabelProps={{
                  shrink,
                  margin: 'dense',
                  sx: {
                    lineHeight: '1.1'
                  }
                }}
                onChange={async (event) => {
                  setFoundIdentities([]);
                  setSearchString(event.target.value);
                }}
              />
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

          {isAuthenticated && contacts.length > 0 && (
            <AddressBookToolBar
              tags={tags}
              addressBookView={addressBookView}
              setAddressBookView={setAddressBookView}
            />
          )}
          {(isSearchingContacts || isFetchingContacts) && (
            <Stack direction="row" m={1} alignSelf="center" alignItems="center" spacing={1}>
              <CircularProgress color="inherit" size={20} />
              <Typography>{isSearchingContacts ? 'Searching' : 'Syncing contacts'}</Typography>
            </Stack>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ mb: isMobile && !showOnTopOfNavigation ? 4 : 0.5 }}>
        <Box display="flex" flexDirection="column" alignContent="center">
          {isAuthenticated && !searchString && contacts.length > 0 && (
            <SearchResultView
              key={'search_identity_contacts'}
              profileRedirect={profileRedirect}
              closeStateCallback={closeStateCallback}
              selectIdentityCallback={selectIdentityCallback}
              updateIdentityCallback={updateIdentityCallback}
              showExtra={addressBookView === 'all'}
              identities={
                addressBookView === 'all'
                  ? contacts
                  : contacts.filter((c) => c.tags?.includes(addressBookView))
              }
            />
          )}

          <SearchResultView
            key={'search_identity_results_view'}
            profileRedirect={profileRedirect}
            closeStateCallback={closeStateCallback}
            selectIdentityCallback={selectIdentityCallback}
            identities={foundIdentities}
            updateIdentityCallback={updateIdentityCallback}
          />

          {(isAuthenticated && contacts.length === 0 && !isFetchingContacts) ||
            (debouncedSearchString &&
              debouncedSearchString.length > 1 &&
              foundIdentities.length === 0 &&
              !isSearchingContacts && (
                <Typography alignSelf="center" variant="subtitle2">
                  No results found.
                </Typography>
              ))}
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
