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
  IconButton
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { Clear, Search } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { ProfileWithSocialsType, SelectedProfileWithSocialsType } from '../types/ProfleType';

import { isAddress } from 'viem';
import { useNavigate } from 'react-router-dom';
import { searchProfile, sortBySocialScore } from '../services/socials';

import { useDebounce } from 'use-debounce';
import { SearchProfileListItem } from './SearchProfileListItem';

export type SelectProfileResultCallbackType = {
  selectProfileCallback?: (selectedProfileWithSocials: SelectedProfileWithSocialsType) => void;
};

export type SearchProfileDialogProps = DialogProps &
  CloseCallbackType &
  SelectProfileResultCallbackType;

export default function SearchProfileDialog({
  closeStateCallback,
  selectProfileCallback,
  ...props
}: SearchProfileDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString, 500);

  const [profiles, setProfiles] = useState<ProfileWithSocialsType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useMemo(async () => {
    if (debouncedSearchString && debouncedSearchString?.length > 2) {
      try {
        setLoading(true);
        const profiles = sortBySocialScore(await searchProfile(debouncedSearchString));
        setProfiles(profiles);
      } finally {
        setLoading(false);
      }
    } else {
      setProfiles([]);
    }
  }, [debouncedSearchString]);

  const [shrink, setShrink] = useState(false);

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Stack minWidth={300} direction="column" alignItems="center">
          <Typography alignSelf="center" variant="h6">
            Search Profile
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="search by name, fc:, lens:, .eth, or 0x"
            value={searchString ?? ''}
            InputProps={{
              startAdornment: shrink && (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: debouncedSearchString && (
                <InputAdornment position="end">
                  <IconButton
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
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          minHeight={300}
          maxHeight={500}>
          {profiles.filter((profileWithSocials) => profileWithSocials.profile).length > 0 && (
            <>
              <Typography variant="subtitle2">Profiles</Typography>

              <Stack m={1} spacing={1}>
                {profiles
                  .filter((profileWithSocials) => profileWithSocials.profile)
                  .map((profileWithSocials) => (
                    <SearchProfileListItem
                      view="profile"
                      profileWithSocials={profileWithSocials}
                      onClick={() => {
                        if (profileWithSocials.profile) {
                          if (selectProfileCallback) {
                            selectProfileCallback({ type: 'profile', data: profileWithSocials });
                          } else {
                            navigate(`/${profileWithSocials.profile.username}`);
                          }
                          closeStateCallback();
                        }
                      }}
                    />
                  ))}
              </Stack>
            </>
          )}

          {searchString &&
            (isAddress(searchString) ||
              searchString.endsWith('.eth') ||
              searchString.endsWith('.xyz') ||
              searchString.startsWith('fc:') ||
              searchString.startsWith('lens:')) &&
            profiles.length > 0 && (
              <>
                <Typography variant="subtitle2">Addresses</Typography>

                <Stack m={1} spacing={1}>
                  {profiles
                    //.filter((profileWithSocials) => profileWithSocials.meta)
                    .map((profileWithSocials) => (
                      <SearchProfileListItem
                        view="address"
                        profileWithSocials={profileWithSocials}
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

          {debouncedSearchString &&
            debouncedSearchString.length > 3 &&
            profiles.length === 0 &&
            !loading &&
            selectProfileCallback && (
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
    </Dialog>
  );
}
