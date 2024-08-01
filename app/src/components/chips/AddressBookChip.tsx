import { BlurOn, History, People, Star } from '@mui/icons-material';
import { Avatar, Chip, Stack, Typography, useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';
import { AddressBookType } from '../../types/ContactType';
import { useEffect, useRef, useState } from 'react';

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
    case 'paragraph':
      return 'Paragraph';
    case 'moxie':
      return 'Moxie';
  }
};

const contactTypeIcon = (type: AddressBookType, selectedType: AddressBookType) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const fontSize = selectedType === type ? 'medium' : 'small';
  const avatarSize = selectedType === type ? { width: 22, height: 22 } : { width: 18, height: 18 };
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
      return <Avatar variant="circular" src="/farcon.png" sx={{ ...avatarSize }} />;
    case 'alfafrens':
      return <Avatar variant="circular" src="/alfafrens.png" sx={{ ...avatarSize }} />;
    case 'hypersub':
      return <Avatar variant="circular" src="/fabric.png" sx={{ ...avatarSize }} />;
    case 'paragraph':
      return (
        <Avatar
          variant="square"
          src="/paragraph.png"
          sx={{ ...avatarSize, backgroundColor: prefersDarkMode ? 'inherit' : grey[700] }}
        />
      );
    case 'moxie':
      return <Avatar variant="square" src="/moxie.png" sx={{ ...avatarSize }} />;
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
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const bgcolor = grey[prefersDarkMode ? 700 : 200];
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

  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <Stack
      spacing={1}
      ref={boxRef}
      my={1}
      mx={0.5}
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      sx={{
        overflowX: 'scroll',
        scrollbarWidth: 'auto', // Hide the scrollbar for firefox
        '&::-webkit-scrollbar': {
          display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
        },
        '&-ms-overflow-style:': {
          display: 'none' // Hide the scrollbar for IE
        },
        '-webkit-overflow-scrolling': 'touch', // Improve scrolling on iOS
        borderRadius: 20
      }}>
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
      {tags.includes('moxie') && (
        <AddressBookChip
          key="moxie"
          type="moxie"
          addressBookView={addressBookView}
          setAddressBookView={setAddressBookView}
        />
      )}
      {tags.includes('hypersub') && (
        <AddressBookChip
          key="hypersub"
          type="hypersub"
          addressBookView={addressBookView}
          setAddressBookView={setAddressBookView}
        />
      )}
      {tags.includes('paragraph') && (
        <AddressBookChip
          key="paragraph"
          type="paragraph"
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
    </Stack>
    /*       <IconButton
        size="small"
        onClick={(event) => {
          setSettingsAchorEl(event.currentTarget);
          setOpenSettings(true);
        }}>
        <Settings fontSize="small" />
      </IconButton> */

    /* <ContactSearchSettings
        open={openSettings}
        onClose={async () => setOpenSettings(false)}
        anchorEl={settingsAchorEl}
      /> */
  );
}
