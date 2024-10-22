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
import { TbWorld } from 'react-icons/tb';
import ResponsiveDialog from './ResponsiveDialog';
import {
  QUERY_FARCASTER_CHANNELS_FOR_USER,
  QUERY_FARCASTER_CHANNELS_FOR_CHANNEL_ID
} from '../../utils/airstackQueries';
import { ProfileContext } from '../../contexts/UserContext';
import { useLazyQuery, useQuery } from '@airstack/airstack-react';
import { Clear, Search } from '@mui/icons-material';
import { useDebounce } from 'use-debounce';

export type ChannelType = {
  channelId: string;
  name: string;
  description: string;
  imageUrl: string;
};

type ChannelSelectorProps = {
  onChannelSelect?: (channel: ChannelType | undefined) => void;
};

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({ onChannelSelect }) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | undefined>(undefined);
  const [openSelectChannel, setOpenSelectChannel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { profile } = useContext(ProfileContext);
  const userIdentity = profile?.identity;

  console.log('search', searchTerm);

  const {
    loading: loadingModerated,
    error: errorModerated,
    data: moderatedChannels
  } = useQuery<ChannelType[]>(
    QUERY_FARCASTER_CHANNELS_FOR_USER,
    { identity: userIdentity },
    {
      cache: true,
      dataFormatter(data) {
        return data?.FarcasterChannels?.FarcasterChannel || [];
      }
    }
  );

  const [
    fetchSearchedChannels,
    { loading: loadingSearched, error: errorSearched, data: searchedChannels }
  ] = useLazyQuery<ChannelType[]>(
    QUERY_FARCASTER_CHANNELS_FOR_CHANNEL_ID,
    { channelId: `^${searchTerm}` },
    {
      cache: true,
      dataFormatter(data) {
        return data?.FarcasterChannels?.FarcasterChannel || [];
      }
    }
  );

  // Update search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Use debouncedSearchTerm for fetching
  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchSearchedChannels();
    }
  }, [debouncedSearchTerm, fetchSearchedChannels]);

  const handleChannelSelect = (channel: ChannelType | undefined) => {
    setSelectedChannel(channel);
    if (onChannelSelect) {
      onChannelSelect(channel);
    }
    setOpenSelectChannel(false);
  };

  const displayChannels = searchTerm ? searchedChannels : moderatedChannels;
  const loading = searchTerm ? loadingSearched : loadingModerated;
  const error = searchTerm ? errorSearched : errorModerated;

  return (
    <>
      <Chip
        onClick={() => setOpenSelectChannel(true)}
        icon={
          selectedChannel ? (
            <Avatar src={selectedChannel.imageUrl} sx={{ width: 24, height: 24 }} />
          ) : (
            <TbWorld size={24} />
          )
        }
        label={
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
            {selectedChannel ? selectedChannel.channelId : 'globally'}
          </Typography>
        }
        deleteIcon={<IoIosArrowDown />}
        onDelete={() => setOpenSelectChannel(true)}
        sx={{
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
        open={openSelectChannel}
        onClose={() => setOpenSelectChannel(false)}
        title="Select Channel"
        width={360}>
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder="Search channels"
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
          ) : loading ? (
            <CircularProgress color="inherit" size={24} sx={{ mt: 2 }} />
          ) : error ? (
            <Typography color="inherit" textAlign="center">
              Error loading channels
            </Typography>
          ) : (
            <Box sx={{ width: '100%', flexGrow: 1, overflow: 'auto' }}>
              <List sx={{ width: '100%' }} dense disablePadding>
                {!searchTerm && (
                  <ListItem
                    key="global"
                    onClick={() => handleChannelSelect(undefined)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                      borderRadius: 5,
                      mb: 0.5,
                      WebkitTapHighlightColor: 'transparent'
                    }}>
                    <ListItemAvatar>
                      <TbWorld size={40} />
                    </ListItemAvatar>
                    <ListItemText
                      primary="Globally"
                      secondary="Casts in all channels and home feeds"
                    />
                  </ListItem>
                )}
                {!searchTerm && displayChannels?.length !== 0 && (
                  <Typography
                    ml={1}
                    textAlign="start"
                    fontSize={14}
                    fontWeight="bold"
                    color="text.secondary">
                    Your channels
                  </Typography>
                )}
                {displayChannels?.map((channel) => (
                  <ListItem
                    key={channel.channelId}
                    onClick={() => handleChannelSelect(channel)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                      borderRadius: 5,
                      mb: 0.5,
                      WebkitTapHighlightColor: 'transparent'
                    }}>
                    <ListItemAvatar>
                      <Avatar src={channel.imageUrl} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={channel.name}
                      secondary={channel.description}
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
                ))}
              </List>
            </Box>
          )}
        </Box>
      </ResponsiveDialog>
    </>
  );
};
