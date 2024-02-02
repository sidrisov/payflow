import { Button, Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { IdentityType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { SearchIdentityListItem } from './SearchIdentityListItem';
import { SelectIdentityCallbackType, UpdateIdentityCallbackType } from './SearchIdentityDialog';
import { useState } from 'react';

const pageSize = 20;

function calculateMaxPages(totalNumber: number, pageSize: number) {
  if (totalNumber <= 0 || pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalNumber / pageSize);
}

export function SearchResultView({
  profileRedirect,
  filterByFafourites = false,
  closeStateCallback,
  selectIdentityCallback: selectProfileCallback,
  updateIdentityCallback: setFavouriteCallback,
  identities
}: {
  filterByFafourites?: boolean;
  profileRedirect?: boolean;
  identities: IdentityType[];
} & CloseCallbackType &
  SelectIdentityCallbackType &
  UpdateIdentityCallbackType) {
  const navigate = useNavigate();

  function SearchResultProfileListView({
    view,
    identities
  }: {
    view: 'address' | 'profile';
    identities: IdentityType[];
  }) {
    const maxPages = calculateMaxPages(identities.length, pageSize);
    const [page, setPage] = useState<number>(1);

    const onIdentityClick =
      selectProfileCallback || view === 'profile'
        ? (identity: IdentityType) => {
            if (view === 'profile') {
              if (identity.profile) {
                if (profileRedirect) {
                  navigate(`/${identity.profile.username}`);
                } else if (selectProfileCallback) {
                  selectProfileCallback({ type: 'profile', identity: identity });
                }
                closeStateCallback();
              }
            } else if (selectProfileCallback) {
              selectProfileCallback({ type: 'address', identity: identity });
              closeStateCallback();
            }
          }
        : undefined;

    return (
      <>
        {identities.length > 0 && (
          <>
            <Typography ml={1} variant="subtitle2">
              {view === 'profile' ? 'Profiles' : 'Addresses'}
              {` (${identities.length})`}
            </Typography>

            <Stack m={1} spacing={1} alignItems="center">
              {identities.slice(0, page * pageSize).map((identity) => (
                <SearchIdentityListItem
                  key={view === 'profile' ? identity.profile?.username : identity.address}
                  view={view}
                  identity={identity}
                  updateIdentityCallback={setFavouriteCallback}
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

  return (
    <>
      <SearchResultProfileListView
        view="profile"
        identities={identities.filter((identity) =>
          filterByFafourites ? identity.favouriteProfile : true && identity.profile
        )}
      />
      <SearchResultProfileListView
        view="address"
        identities={identities.filter((identity) =>
          filterByFafourites ? identity.favouriteAddress : true && identity.meta
        )}
      />
    </>
  );
}
