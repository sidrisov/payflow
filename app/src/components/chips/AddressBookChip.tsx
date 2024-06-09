import { People, Settings, Star } from '@mui/icons-material';
import { Avatar, Box, Chip, IconButton, Typography } from '@mui/material';
import { yellow, green, grey, deepPurple, blue, pink } from '@mui/material/colors';
import { AddressBookType } from '../../types/ContactType';
import { useState } from 'react';

const contactTypeLabel = (type: AddressBookType) => {
  switch (type) {
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

const contactTypeIcon = (type: AddressBookType) => {
  switch (type) {
    case 'favourites':
      return <Star fontSize="medium" />;
    case 'friends':
      return <People fontSize="medium" />;
    case 'farcon':
      return <Avatar variant="circular" src="/farcon.png" sx={{ width: 24, height: 24 }} />;
    case 'hypersub':
      return <Avatar variant="circular" src="/fabric.png" sx={{ width: 24, height: 24 }} />;
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
