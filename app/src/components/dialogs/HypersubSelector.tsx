import React, { useState, useContext, useEffect } from 'react';
import {
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Box,
  TextField
} from '@mui/material';
import { IoIosArrowDown } from 'react-icons/io';
import ResponsiveDialog from './ResponsiveDialog';

import { ProfileContext } from '../../contexts/UserContext';
import { Clear, Search } from '@mui/icons-material';
import { useDebounce } from 'use-debounce';

import { useHypersubSearch } from '../../utils/hooks/useHypersub';
import { MdOutlineQuestionMark } from 'react-icons/md';

export type HypersubType = {
  hypersubId: string;
  name: string;
  description: string;
  imageUrl: string;
};

type HypersubSelectorProps = {
  disabled?: boolean;
  onHypersubSelect?: (hypersub: HypersubType | undefined) => void;
};

export const HypersubSelector: React.FC<HypersubSelectorProps> = ({
  disabled,
  onHypersubSelect
}) => {
  const [selectedHypersub, setSelectedHypersub] = useState<HypersubType | undefined>(undefined);
  const [openSelectHypersub, setOpenSelectHypersub] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { profile } = useContext(ProfileContext);
  const userIdentity = profile?.identity;

  const {
    hypersubData,
    loading: loadingSearched,
    error: errorSearched
  } = useHypersubSearch(debouncedSearchTerm);

  // Update search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (!hypersubData) {
      setSelectedHypersub(undefined);
      onHypersubSelect?.(undefined);
    }
  }, [hypersubData]);

  const handleHypersubSelect = (hypersub: HypersubType | undefined) => {
    setSelectedHypersub(hypersub);
    onHypersubSelect?.(hypersub);
    setOpenSelectHypersub(false);
  };

  return (
    <>
      <Chip
        onClick={() => setOpenSelectHypersub(true)}
        disabled={disabled}
        icon={
          selectedHypersub ? (
            <Avatar src={selectedHypersub.imageUrl} sx={{ width: 24, height: 24 }} />
          ) : (
            <MdOutlineQuestionMark size={24} />
          )
        }
        label={
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
            {selectedHypersub ? selectedHypersub.name : 'none'}
          </Typography>
        }
        deleteIcon={<IoIosArrowDown />}
        onDelete={() => setOpenSelectHypersub(true)}
        sx={{
          maxWidth: 150,
          height: 40,
          borderRadius: 5,
          px: 0.5,
          gap: 0.5,
          '& .MuiChip-label': { px: 1 },
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          border: 1,
          borderColor: 'divider'
        }}
      />
      <ResponsiveDialog
        open={openSelectHypersub}
        onClose={() => setOpenSelectHypersub(false)}
        title="Select Hypersub"
        width={360}>
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder="Subscription contract address: 0x..."
          value={searchTerm}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              sx: { borderRadius: 5 },

              startAdornment: <Search sx={{ mr: 0.5 }} />,
              endAdornment: searchTerm ? (
                <Clear fontSize="small" onClick={() => setSearchTerm('')} />
              ) : null
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'text.primary',
                borderWidth: 1
              }
            },
            mb: 1
          }}
        />
        <Box
          width="100%"
          height={350}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!userIdentity ? (
            <Typography textAlign="center">User identity not available</Typography>
          ) : loadingSearched ? (
            <CircularProgress color="inherit" size={24} sx={{ mt: 2 }} />
          ) : errorSearched ? (
            <Typography color="inherit" textAlign="center">
              Error loading subscriptions
            </Typography>
          ) : (
            <Box sx={{ width: '100%', flexGrow: 1, overflow: 'auto' }}>
              <List sx={{ width: '100%' }} dense disablePadding>
                {hypersubData && (
                  <ListItem
                    key={hypersubData.contractAddress}
                    onClick={() =>
                      handleHypersubSelect({
                        hypersubId: hypersubData.contractAddress,
                        name: hypersubData.metadata?.name || '',
                        description: hypersubData.metadata?.description || '',
                        imageUrl: hypersubData.metadata?.image || ''
                      })
                    }
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                      borderRadius: 5,
                      mb: 0.5,
                      WebkitTapHighlightColor: 'transparent'
                    }}>
                    <ListItemAvatar>
                      <Avatar src={hypersubData.metadata?.image} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={hypersubData.metadata?.name}
                      secondary={hypersubData.metadata?.description}
                      secondaryTypographyProps={{
                        sx: {
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </Box>
      </ResponsiveDialog>
    </>
  );
};
