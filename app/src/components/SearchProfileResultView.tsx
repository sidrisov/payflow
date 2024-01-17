import { Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { ProfileWithSocialsType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { SearchProfileListItem } from './SearchProfileListItem';
import { FavouriteType } from '../types/FavouriteType';
import { SelectProfileResultCallbackType } from './SearchProfileDialog';

export function SearchProfileResultView({
  addressBookEnabled = false,
  profileRedirect,
  closeStateCallback,
  selectProfileCallback,
  favourites = [],
  profiles,
  addresses
}: {
  addressBookEnabled?: boolean;
  profileRedirect?: boolean;
  favourites?: FavouriteType[];
  profiles: ProfileWithSocialsType[];
  addresses: ProfileWithSocialsType[];
} & CloseCallbackType &
  SelectProfileResultCallbackType) {
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
              .filter((profileWithSocials) => profileWithSocials.profile)
              .map((profileWithSocials) => (
                <SearchProfileListItem
                  key={profileWithSocials.profile?.username}
                  view="profile"
                  profileWithSocials={profileWithSocials}
                  favouritesEnabled={addressBookEnabled}
                  favourite={
                    favourites?.find(
                      (f) =>
                        f.identity.toLowerCase() ===
                        profileWithSocials.profile?.identity.toLowerCase()
                    )?.profileChecked
                  }
                  onClick={() => {
                    if (profileWithSocials.profile) {
                      if (profileRedirect) {
                        navigate(`/${profileWithSocials.profile.username}`);
                      } else if (selectProfileCallback) {
                        selectProfileCallback({ type: 'profile', data: profileWithSocials });
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
              .filter((profileWithSocials) => profileWithSocials.meta)
              .map((profileWithSocials) => (
                <SearchProfileListItem
                  key={profileWithSocials.meta?.addresses[0]}
                  view="address"
                  profileWithSocials={profileWithSocials}
                  favouritesEnabled={addressBookEnabled}
                  favourite={
                    favourites?.find((f) => f.identity === profileWithSocials.meta?.addresses[0])
                      ?.addressChecked
                  }
                  onClick={() => {
                    if (selectProfileCallback) {
                      selectProfileCallback({ type: 'address', data: profileWithSocials });
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
