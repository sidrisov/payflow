import {
  Dialog,
  DialogContent,
  DialogProps,
  TextField,
  DialogTitle,
  InputAdornment,
  Box,
  Stack,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { ArrowBack, Clear } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import { ContactType, SelectedIdentityType } from '@payflow/common';

import { Address } from 'viem';
import { searchIdentity, sortBySocialScore } from '../../services/socials';

import { useDebounce } from 'use-debounce';
import { SearchResultView } from '../SearchResultView';
import { ProfileContext } from '../../contexts/UserContext';
import { AddressBookType } from '../../types/ContactType';
import { AddressBookToolBar } from '../chips/AddressBookChip';
import { useContacts } from '../../utils/queries/contacts';
import { useSearchParams } from 'react-router';
import { useMobile } from '../../utils/hooks/useMobile';

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
  const isMobile = useMobile();

  const accessToken = useSearchParams()[0].get('access_token') ?? undefined;

  const { isAuthenticated } = useContext(ProfileContext);

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString?.trim().toLowerCase(), 1000, {
    maxWait: 10000
  });

  const [foundIdentities, setFoundIdentities] = useState<ContactType[]>([]);
  const [isSearchingContacts, setSearchingContacts] = useState<boolean>(false);

  const [addressBookView, setAddressBookView] = useState<AddressBookType>('all');

  const { isFetching: isFetchingContacts, data: contactsData } = useContacts({
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
    if (!isFetchingContacts && contactsData) {
      setTags(contactsData.tags);
      setContacts(contactsData.contacts);
    }
  }, [contactsData, isFetchingContacts]);

  useEffect(() => {
    console.log('Searching among contacts and globally: ', debouncedSearchString);
    if (debouncedSearchString && debouncedSearchString.length > 1) {
      const fetchData = async () => {
        await searchContacts(debouncedSearchString);
      };

      fetchData();
    }
  }, [debouncedSearchString, address, addressBookView]);

  async function searchContacts(debouncedSearchString: string) {
    try {
      setSearchingContacts(true);
      // search among contacts
      let foundAmongContacts: ContactType[] = [];
      if (contacts?.length > 0) {
        // support different search criterias, e.g. if with fc search only among fc name, if lens, if eth...,
        // also if search by ens and result is found, skip online search
        foundAmongContacts = contacts.filter(
          (c) =>
            (addressBookView !== 'all'
              ? addressBookView === 'friends'
                ? c.tags?.includes('friends') || c.tags?.includes('efp')
                : c.tags?.includes(addressBookView)
              : true) &&
            (c.data.profile?.username?.includes(debouncedSearchString) ||
              c.data.profile?.displayName?.toLowerCase().includes(debouncedSearchString) ||
              c.data.meta?.ens?.includes(debouncedSearchString) ||
              c.data.meta?.socials?.find((s) => {
                return (
                  s.profileDisplayName.toLowerCase().includes(debouncedSearchString) ||
                  s.profileName.includes(debouncedSearchString)
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

        const allFoundProfiles = sortBySocialScore(foundAmongContacts.concat(identities));
        console.debug('All found profiles:', allFoundProfiles);
        setFoundIdentities(allFoundProfiles);
      }
    } finally {
      setSearchingContacts(false);
    }
  }

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
        ...(showOnTopOfNavigation && { zIndex: 1450 }),
        backdropFilter: 'blur(3px)'
      }}
      slotProps={{
        paper: {
          sx: {
            ...(!isMobile && { width: 425, height: 650, borderRadius: 5 })
          }
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
                label="Search by username, ens, or address"
                type="text"
                value={searchString ?? ''}
                slotProps={{
                  input: {
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
                  },
                  inputLabel: {
                    shrink,
                    margin: 'dense',
                    sx: {
                      lineHeight: '1.1'
                    }
                  }
                }}
                onFocus={() => setShrink(true)}
                onBlur={(e) => setShrink(!!e.target.value)}
                onChange={async (event) => {
                  setFoundIdentities([]);
                  setSearchString(event.target.value);
                }}
              />
            </Stack>
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
      <DialogContent
        sx={{ mb: isMobile && !showOnTopOfNavigation ? 4 : 0.5, scrollbarWidth: 'thin' }}>
        <Box display="flex" flexDirection="column" alignContent="center">
          {isAuthenticated && !searchString && contacts.length > 0 && (
            <SearchResultView
              key={'search_identity_contacts'}
              profileRedirect={profileRedirect}
              closeStateCallback={closeStateCallback}
              selectIdentityCallback={selectIdentityCallback}
              // pass only if this is not used in selecting contacts
              {...(!selectIdentityCallback && {
                updateIdentityCallback
              })}
              showExtra={addressBookView === 'all'}
              identities={
                addressBookView === 'all'
                  ? contacts
                  : contacts.filter((c) =>
                      addressBookView === 'friends'
                        ? c.tags?.includes('friends') || c.tags?.includes('efp')
                        : c.tags?.includes(addressBookView)
                    )
              }
            />
          )}

          <SearchResultView
            key={'search_identity_results_view'}
            profileRedirect={profileRedirect}
            closeStateCallback={closeStateCallback}
            selectIdentityCallback={selectIdentityCallback}
            identities={foundIdentities}
            {...(!selectIdentityCallback && {
              updateIdentityCallback
            })}
          />

          {(isAuthenticated && contacts.length === 0 && !isFetchingContacts) ||
            (debouncedSearchString &&
              debouncedSearchString.length > 1 &&
              searchString === debouncedSearchString &&
              foundIdentities.length === 0 &&
              !isSearchingContacts && (
                <Typography alignSelf="center" variant="subtitle2">
                  No results found.
                </Typography>
              ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
