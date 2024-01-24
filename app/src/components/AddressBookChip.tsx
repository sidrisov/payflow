import { Star } from '@mui/icons-material';
import { Chip, Stack, Typography } from '@mui/material';
import { yellow, green, grey } from '@mui/material/colors';

export function AddressBookChip({
  type,
  addressBookView,
  setAddressBookView
}: {
  type: 'favourites' | 'friends';
  addressBookView: 'favourites' | 'friends';
  setAddressBookView: (value: React.SetStateAction<'favourites' | 'friends'>) => void;
}) {
  const color = type === 'favourites' ? yellow.A700 : green.A700;
  const bgcolor = grey[700];

  return (
    <Chip
      clickable
      icon={<Star fontSize="small" />}
      label={
        <Typography variant="caption" fontWeight="bold">
          {type === 'favourites' ? 'Favourites' : 'People you know'}
        </Typography>
      }
      sx={{
        color,
        '& .MuiChip-icon': {
          color
        },
        bgcolor: addressBookView === type ? bgcolor : 'inherit',
        '&:hover': { bgcolor }
      }}
      onClick={async () => {
        setAddressBookView(type);
      }}
    />
  );
}

export function AddressBookToolBar({
  addressBookView,
  setAddressBookView
}: {
  addressBookView: 'favourites' | 'friends';
  setAddressBookView: (value: React.SetStateAction<'favourites' | 'friends'>) => void;
}) {
  return (
    <Stack my={1} spacing={1} direction="row" alignItems="center" alignSelf="center">
      <AddressBookChip
        key="favourites"
        type="favourites"
        addressBookView={addressBookView}
        setAddressBookView={setAddressBookView}
      />

      <AddressBookChip
        key="friends"
        type="friends"
        addressBookView={addressBookView}
        setAddressBookView={setAddressBookView}
      />
    </Stack>
  );
}
