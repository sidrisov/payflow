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
import { CloseCallbackType } from '../types/CloseCallbackType';
import { ArrowBack, Clear, Menu } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { ProfileWithSocialsType, SelectedProfileWithSocialsType } from '../types/ProfleType';

import { Address, isAddress } from 'viem';
import { useNavigate } from 'react-router-dom';
import { searchProfile, sortBySocialScore } from '../services/socials';

import { useDebounce } from 'use-debounce';
import { SearchProfileListItem } from './SearchProfileListItem';
import { WalletMenu } from './WalletMenu';

export type SelectProfileResultCallbackType = {
  selectProfileCallback?: (selectedProfileWithSocials: SelectedProfileWithSocialsType) => void;
};

export type SearchProfileDialogProps = DialogProps &
  CloseCallbackType &
  SelectProfileResultCallbackType & {
    address?: Address;
    profileRedirect?: boolean;
    walletMenuEnabled?: boolean;
  };

// TODO: back button + title alignment hack - check with someone knowledgeable on proper solution
export default function SearchProfileDialog({
  address,
  profileRedirect,
  walletMenuEnabled,
  closeStateCallback,
  selectProfileCallback,
  ...props
}: SearchProfileDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const [searchString, setSearchString] = useState<string>();

  const [debouncedSearchString] = useDebounce(searchString, 500);

  const [profiles, setProfiles] = useState<ProfileWithSocialsType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useMemo(async () => {
    if (debouncedSearchString && debouncedSearchString?.length > 1) {
      try {
        setLoading(true);
        const profiles = sortBySocialScore(await searchProfile(debouncedSearchString, address));
        setProfiles(profiles);
      } finally {
        setLoading(false);
      }
    } else {
      setProfiles([]);
    }
  }, [debouncedSearchString, address]);

  const [shrink, setShrink] = useState(false);

  return (
    <Dialog
      fullScreen={isMobile}
      onClose={handleCloseCampaignDialog}
      sx={{
        backdropFilter: 'blur(5px)'
      }}
      PaperProps={{ sx: { borderRadius: 5 } }}
      {...props}>
      <DialogTitle>
        <Stack minWidth={300}>
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
                      key={profileWithSocials.profile?.username}
                      view="profile"
                      profileWithSocials={profileWithSocials}
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

          {searchString &&
            (isAddress(searchString) ||
              searchString.endsWith('.eth') ||
              searchString.endsWith('.xyz') ||
              searchString.endsWith('.id') ||
              searchString.startsWith('fc:') ||
              searchString.startsWith('lens:')) &&
            profiles.length > 0 && (
              <>
                <Typography variant="subtitle2">Addresses</Typography>

                <Stack m={1} spacing={1}>
                  {profiles
                    .filter((profileWithSocials) => profileWithSocials.meta)
                    .map((profileWithSocials) => (
                      <SearchProfileListItem
                        key={profileWithSocials.meta?.addresses[0]}
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
            debouncedSearchString.length > 1 &&
            profiles.length === 0 &&
            !loading && (
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
