import { Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { IdentityType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { SearchIdentityListItem } from './SearchIdentityListItem';
import { SelectIdentityCallbackType, UpdateIdentityCallbackType } from './SearchIdentityDialog';

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
    return (
      <>
        {identities.length > 0 && (
          <>
            <Typography ml={1} variant="subtitle2">
              {view === 'profile' ? 'Profiles' : 'Addresses'}
              {` (${identities.length})`}
            </Typography>

            <Stack m={1} spacing={1}>
              {identities.map((identity) => (
                <SearchIdentityListItem
                  key={view === 'profile' ? identity.profile?.username : identity.address}
                  view={view}
                  identity={identity}
                  updateIdentityCallback={setFavouriteCallback}
                  onClick={() => {
                    if (view === 'profile') {
                      if (identity.profile) {
                        if (profileRedirect) {
                          navigate(`/${identity.profile.username}`);
                        } else if (selectProfileCallback) {
                          selectProfileCallback({ type: 'profile', identity: identity });
                        }
                        closeStateCallback();
                      }
                    } else {
                      if (selectProfileCallback) {
                        selectProfileCallback({ type: 'address', identity: identity });
                        closeStateCallback();
                      }
                    }
                  }}
                />
              ))}
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
