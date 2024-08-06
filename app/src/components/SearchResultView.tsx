import { Button, Divider, Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { ContactType } from '../types/ProfileType';
import { useNavigate } from 'react-router-dom';
import { SearchIdentityListItem } from './SearchIdentityListItem';
import {
  SelectIdentityCallbackType,
  UpdateIdentityCallbackType
} from './dialogs/SearchIdentityDialog';
import { useState } from 'react';
import calculateMaxPages from '../utils/pagination';

const pageSize = 30;

interface SearchResultViewProps
  extends CloseCallbackType,
    SelectIdentityCallbackType,
    UpdateIdentityCallbackType {
  profileRedirect?: boolean;
  showExtra?: boolean;
  identities: ContactType[];
}

interface SearchResultProfileListViewProps {
  title: string;
  identities: ContactType[];
  profileRedirect?: boolean;
  selectIdentityCallback?: SelectIdentityCallbackType['selectIdentityCallback'];
  updateIdentityCallback?: UpdateIdentityCallbackType['updateIdentityCallback'];
  closeStateCallback: CloseCallbackType['closeStateCallback'];
}

export function SearchResultView({
  profileRedirect,
  showExtra,
  closeStateCallback,
  selectIdentityCallback,
  updateIdentityCallback,
  identities
}: SearchResultViewProps) {
  const navigate = useNavigate();

  function SearchResultProfileListView({
    title,
    identities,
    profileRedirect,
    selectIdentityCallback,
    updateIdentityCallback,
    closeStateCallback
  }: SearchResultProfileListViewProps) {
    // Merge profiles and addresses inside this function
    const mergedIdentities = [
      ...identities
        .filter((identity) => identity.data.profile)
        .map((identity) => ({ identity, view: 'profile' })),
      ...identities
        .filter((identity) => identity.data.meta)
        .map((identity) => ({ identity, view: 'address' }))
    ] as { identity: ContactType; view: 'address' | 'profile' }[];

    const maxPages = calculateMaxPages(mergedIdentities.length, pageSize);
    const [page, setPage] = useState<number>(1);

    const onIdentityClick = (contact: ContactType, view: 'address' | 'profile') => {
      if (profileRedirect) {
        navigate(`/${contact.data.profile?.username ?? contact.data.address}`);
      } else if (selectIdentityCallback) {
        selectIdentityCallback({
          type: view,
          identity: contact.data
        });
      }
      closeStateCallback();
    };

    return (
      <>
        {mergedIdentities.length > 0 && (
          <>
            <Typography ml={1} variant="subtitle2">
              {title}
              {` (${mergedIdentities.length})`}
            </Typography>

            <Stack m={1} spacing={1} alignItems="center">
              {mergedIdentities.slice(0, page * pageSize).map(({ identity, view }) => (
                <SearchIdentityListItem
                  key={view === 'profile' ? identity.data.profile?.username : identity.data.address}
                  view={view}
                  contact={identity}
                  updateIdentityCallback={updateIdentityCallback}
                  onClick={() => onIdentityClick(identity, view)}
                />
              ))}
              {page < maxPages && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  sx={{
                    p: 1,
                    textTransform: 'none',
                    borderRadius: 5
                  }}>
                  <Typography variant="subtitle2">Load more contacts</Typography>
                </Button>
              )}
            </Stack>
          </>
        )}
      </>
    );
  }

  const verifications = showExtra
    ? identities.filter((identity) => identity.tags?.includes('verifications'))
    : [];

  const popular = showExtra
    ? identities.filter((identity) => identity.tags?.includes('popular'))
    : [];

  return (
    <>
      {showExtra && (
        <>
          <SearchResultProfileListView
            title="My wallets"
            identities={verifications}
            profileRedirect={profileRedirect}
            selectIdentityCallback={selectIdentityCallback}
            updateIdentityCallback={updateIdentityCallback}
            closeStateCallback={closeStateCallback}
          />
          <SearchResultProfileListView
            title="Popular"
            identities={popular}
            profileRedirect={profileRedirect}
            selectIdentityCallback={selectIdentityCallback}
            updateIdentityCallback={updateIdentityCallback}
            closeStateCallback={closeStateCallback}
          />
          {(verifications.length > 0 || popular.length > 0) && (
            <Divider flexItem variant="middle" sx={{ mb: 1.5 }} />
          )}
        </>
      )}

      <SearchResultProfileListView
        title="Contacts"
        identities={identities}
        profileRedirect={profileRedirect}
        selectIdentityCallback={selectIdentityCallback}
        updateIdentityCallback={updateIdentityCallback}
        closeStateCallback={closeStateCallback}
      />
    </>
  );
}
