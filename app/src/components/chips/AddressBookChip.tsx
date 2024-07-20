import { BlurOn, History, Payments, People, Sell, Star } from '@mui/icons-material';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import { yellow, green, grey, deepPurple, blue, pink, purple } from '@mui/material/colors';
import { AddressBookType } from '../../types/ContactType';
import { useState } from 'react';

const contactTypeLabel = (type: AddressBookType) => {
  switch (type) {
    case 'all':
      return 'All';
    case 'recent':
      return 'Recently';
    case 'favourites':
      return 'Favourites';
    case 'friends':
      return 'Friends';
    case 'farcon':
      return 'FarCon';
    case 'alfafrens':
      return 'AlfaFrens';
    case 'hypersub':
      return 'Hypersubs';
  }
};

const contactTypeColor = (type: AddressBookType) => {
  switch (type) {
    case 'favourites':
      return yellow.A700;
    case 'friends':
      return green.A700;
    case 'farcon':
      return deepPurple.A100;
    case 'alfafrens':
      return blue[400];
    case 'hypersub':
      return pink[400];
  }
};

const contactTypeIcon = (type: AddressBookType, selectedType: AddressBookType) => {
  const fontSize = selectedType === type ? 'medium' : 'small';
  const avatarSize = selectedType === type ? { width: 24, height: 24 } : { width: 20, height: 20 };
  switch (type) {
    case 'all':
      return <BlurOn fontSize={fontSize} />;
    case 'recent':
      return <History fontSize={fontSize} />;
    case 'favourites':
      return <Star fontSize={fontSize} />;
    case 'friends':
      return <People fontSize={fontSize} />;
    case 'farcon':
      return <Avatar variant="circular" src="/farcon.png" sx={avatarSize} />;
    case 'alfafrens':
      return <Avatar variant="circular" src="/alfafrens.png" sx={avatarSize} />;
    case 'hypersub':
      return <Avatar variant="circular" src="/fabric.png" sx={avatarSize} />;
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
      icon={contactTypeIcon(type, addressBookView)}
      label={
        <Typography
          fontSize={addressBookView === type ? 13 : 12}
          fontWeight={addressBookView === type ? 'bold' : 'medium'}>
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
  tags,
  addressBookView,
  setAddressBookView
}: {
  tags: string[];
  addressBookView: AddressBookType;
  setAddressBookView: (value: React.SetStateAction<AddressBookType>) => void;
}) {
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [settingsAchorEl, setSettingsAchorEl] = useState<null | HTMLElement>(null);

  console.log('tags, ', tags);

  return (
    <Box
      my={1}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap={0.5}>
      <Box
        mx={0.5}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-evenly"
        sx={{
          overflow: 'scroll',
          scrollbarWidth: 'auto', // Hide the scrollbar for firefox
          '&::-webkit-scrollbar': {
            display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
          },
          '&-ms-overflow-style:': {
            display: 'none' // Hide the scrollbar for IE
          },
          borderRadius: 20
        }}
        gap={0.5}>
        <AddressBookChip
          key="all"
          type="all"
          addressBookView={addressBookView}
          setAddressBookView={setAddressBookView}
        />
        {tags.includes('recent') && (
          <AddressBookChip
            key="recent"
            type="recent"
            addressBookView={addressBookView}
            setAddressBookView={setAddressBookView}
          />
        )}
        {tags.includes('favourites') && (
          <AddressBookChip
            key="favourites"
            type="favourites"
            addressBookView={addressBookView}
            setAddressBookView={setAddressBookView}
          />
        )}
        <AddressBookChip
          key="friends"
          type="friends"
          addressBookView={addressBookView}
          setAddressBookView={setAddressBookView}
        />
        {tags.includes('hypersub') && (
          <AddressBookChip
            key="hypersub"
            type="hypersub"
            addressBookView={addressBookView}
            setAddressBookView={setAddressBookView}
          />
        )}
        {tags.includes('alfafrens') && (
          <AddressBookChip
            key="alfafrens"
            type="alfafrens"
            addressBookView={addressBookView}
            setAddressBookView={setAddressBookView}
          />
        )}
        {/* {tags.includes('farcon') && (
          <AddressBookChip
            key="farcon"
            type="farcon"
            addressBookView={addressBookView}
            setAddressBookView={setAddressBookView}
          />
        )} */}
      </Box>
      {/*       <IconButton
        size="small"
        onClick={(event) => {
          setSettingsAchorEl(event.currentTarget);
          setOpenSettings(true);
        }}>
        <Settings fontSize="small" />
      </IconButton> */}

      {/* <ContactSearchSettings
        open={openSettings}
        onClose={async () => setOpenSettings(false)}
        anchorEl={settingsAchorEl}
      /> */}
    </Box>
  );
}
