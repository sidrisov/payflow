import React, { useState, useContext } from 'react';
import {
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import { IoIosArrowDown } from 'react-icons/io';
import { TbWorld } from 'react-icons/tb';
import ResponsiveDialog from './ResponsiveDialog';
import { QUERY_FARCASTER_CHANNELS_FOR_USER } from '../../utils/airstackQueries';
import { ProfileContext } from '../../contexts/UserContext';
import { useQuery } from '@airstack/airstack-react';
import { TfiWorld } from 'react-icons/tfi';
import { Public } from '@mui/icons-material';

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

  const { profile } = useContext(ProfileContext);
  const userIdentity = profile?.identity;

  const {
    loading,
    error,
    data: channels
  } = useQuery<ChannelType[]>(
    QUERY_FARCASTER_CHANNELS_FOR_USER,
    { identity: profile?.identity },
    {
      cache: true,
      dataFormatter(data) {
        return data?.FarcasterChannels?.FarcasterChannel || [];
      }
    }
  );

  console.log(channels);

  const handleChannelSelect = (channel: ChannelType | undefined) => {
    setSelectedChannel(channel);
    setOpenSelectChannel(false);
    if (onChannelSelect) {
      onChannelSelect(channel);
    }
  };

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
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          {!userIdentity ? (
            <Typography textAlign="center">User identity not available</Typography>
          ) : loading ? (
            <CircularProgress color="inherit" size={24} />
          ) : error ? (
            <Typography color="error" textAlign="center">
              Error loading channels
            </Typography>
          ) : (
            <List sx={{ width: '100%' }}>
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
                <ListItemText primary="Globally" secondary="Casts in all channels and home feed" />
              </ListItem>
              {channels?.map((channel) => (
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
          )}
        </Box>
      </ResponsiveDialog>
    </>
  );
};
