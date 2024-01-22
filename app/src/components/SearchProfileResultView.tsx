import { Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { IdentityType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { SearchProfileListItem } from './SearchProfileListItem';
import { SelectProfileResultCallbackType, SetFavouriteCallbackType } from './SearchProfileDialog';

export function SearchProfileResultView({
  addressBookEnabled = false,
  profileRedirect,
  closeStateCallback,
  selectProfileCallback,
  setFavouriteCallback,
  favourites = [],
  profiles,
  addresses
}: {
  addressBookEnabled?: boolean;
  profileRedirect?: boolean;
  favourites?: IdentityType[];
  profiles: IdentityType[];
  addresses: IdentityType[];
} & CloseCallbackType &
  SelectProfileResultCallbackType &
  SetFavouriteCallbackType) {
  const navigate = useNavigate();

  return (
    <>
      {profiles.length > 0 && (
        <>
          <Typography ml={1} variant="subtitle2">
            Profiles
          </Typography>

          <Stack m={1} spacing={1}>
            {profiles
              .filter((identity) => identity.profile)
              .map((identity) => (
                <SearchProfileListItem
                  key={identity.profile?.username}
                  view="profile"
                  identity={identity}
                  favouritesEnabled={addressBookEnabled}
                  favourite={
                    favourites?.find(
                      (f) => f.address.toLowerCase() === identity.profile?.identity.toLowerCase()
                    )?.favouriteProfile
                  }
                  setFavouriteCallback={setFavouriteCallback}
                  onClick={() => {
                    if (identity.profile) {
                      if (profileRedirect) {
                        navigate(`/${identity.profile.username}`);
                      } else if (selectProfileCallback) {
                        selectProfileCallback({ type: 'profile', identity: identity });
                      }
                      closeStateCallback();
                    }
                  }}
                />
              ))}
          </Stack>
        </>
      )}

      {addresses.length > 0 && (
        <>
          <Typography ml={1} variant="subtitle2">
            Addresses
          </Typography>

          <Stack m={1} spacing={1}>
            {addresses
              .filter((identity) => identity.meta)
              .map((identity) => (
                <SearchProfileListItem
                  key={identity.address}
                  view="address"
                  identity={identity}
                  favouritesEnabled={addressBookEnabled}
                  favourite={
                    favourites?.find((f) => f.address === identity.address)?.favouriteAddress
                  }
                  setFavouriteCallback={setFavouriteCallback}
                  onClick={() => {
                    if (selectProfileCallback) {
                      selectProfileCallback({ type: 'address', identity: identity });
                      closeStateCallback();
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
