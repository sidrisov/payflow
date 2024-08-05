import { Button, Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { ContactType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { SearchIdentityListItem } from './SearchIdentityListItem';
import {
  SelectIdentityCallbackType,
  UpdateIdentityCallbackType
} from './dialogs/SearchIdentityDialog';
import { useState } from 'react';
import calculateMaxPages from '../utils/pagination';

const pageSize = 20;

export function SearchResultView({
  profileRedirect,
  showVerifications,
  closeStateCallback,
  selectIdentityCallback,
  updateIdentityCallback,
  identities
}: {
  profileRedirect?: boolean;
  showVerifications?: boolean;
  identities: ContactType[];
} & CloseCallbackType &
  SelectIdentityCallbackType &
  UpdateIdentityCallbackType) {
  const navigate = useNavigate();

  function SearchResultProfileListView({
    title,
    view,
    identities
  }: {
    title: string;
    view: 'address' | 'profile';
    identities: ContactType[];
  }) {
    const maxPages = calculateMaxPages(identities.length, pageSize);
    const [page, setPage] = useState<number>(1);

    const onIdentityClick = (contact: ContactType) => {
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
        {identities.length > 0 && (
          <>
            <Typography ml={1} variant="subtitle2">
              {title}
              {` (${identities.length})`}
            </Typography>

            <Stack m={1} spacing={1} alignItems="center">
              {identities.slice(0, page * pageSize).map((identity) => (
                <SearchIdentityListItem
                  key={view === 'profile' ? identity.data.profile?.username : identity.data.address}
                  view={view}
                  contact={identity}
                  updateIdentityCallback={updateIdentityCallback}
                  {...(onIdentityClick ? { onClick: () => onIdentityClick?.(identity) } : {})}
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
                  <Typography variant="subtitle2">
                    {view === 'profile' ? 'Load more profiles' : 'Load more addresses'}
                  </Typography>
                </Button>
              )}
            </Stack>
          </>
        )}
      </>
    );
  }

  const verifications = showVerifications
    ? identities.filter((identity) => identity.tags?.includes('verifications'))
    : [];
  const profiles = identities.filter(
    (identity) =>
      identity.data.profile &&
      (showVerifications ? !identity.tags?.includes('verifications') : true)
  );
  const addresses = identities.filter((identity) => identity.data.meta);

  return (
    <>
      {showVerifications && (
        <SearchResultProfileListView
          title="My wallets"
          view="address"
          identities={verifications}
        />
      )}
      <SearchResultProfileListView title="Profiles" view="profile" identities={profiles} />
      <SearchResultProfileListView title="Addresses" view="address" identities={addresses} />
    </>
  );
}
