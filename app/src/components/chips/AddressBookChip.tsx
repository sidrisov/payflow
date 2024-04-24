import { People, Star } from '@mui/icons-material';
import { Avatar, Chip, Stack, Typography } from '@mui/material';
import { yellow, green, grey, deepPurple, purple } from '@mui/material/colors';
import { AddressBookType } from '../../types/ContactType';

const contactTypeLabel = (type: AddressBookType) => {
  switch (type) {
    case 'favourites':
      return 'Favourites';
    case 'friends':
      return 'Friends';
    case 'ethdenver':
      return 'FarCon';
  }
};

const contactTypeColor = (type: AddressBookType) => {
  switch (type) {
    case 'favourites':
      return yellow.A700;
    case 'friends':
      return green.A700;
    case 'ethdenver':
      return deepPurple.A100;
  }
};

const contactTypeIcon = (type: AddressBookType) => {
  switch (type) {
    case 'favourites':
      return <Star fontSize="medium" />;
    case 'friends':
      return <People fontSize="medium" />;
    case 'ethdenver':
      return <Avatar variant="circular" src="/farcon.png" sx={{ width: 24, height: 24 }} />;
  }
};

type AddressBookChipProps = {
  type: AddressBookType;
  addressBookView: AddressBookType;
  setAddressBookView: (value: React.SetStateAction<AddressBookType>) => void;
};

export function AddressBookChip({
  type,
  addressBookView,
  setAddressBookView
}: AddressBookChipProps) {
  const color = contactTypeColor(type);
  const bgcolor = grey[700];

  return (
    <Chip
      clickable
      icon={contactTypeIcon(type)}
      label={
        <Typography variant="caption" fontWeight="bold">
          {contactTypeLabel(type)}
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
  addressBookView: AddressBookType;
  setAddressBookView: (value: React.SetStateAction<AddressBookType>) => void;
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

      {import.meta.env.VITE_ETH_DENVER_CONTACTS_ENABLED === 'true' && (
        <AddressBookChip
          key="ethdenver"
          type="ethdenver"
          addressBookView={addressBookView}
          setAddressBookView={setAddressBookView}
        />
      )}
    </Stack>
  );
}
