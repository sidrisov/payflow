import { Circle } from '@mui/icons-material';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Stack,
  Typography,
  Chip,
  Skeleton
} from '@mui/material';
import { countdown } from '../../utils/date';
import { useFanTokens } from '../../utils/queries/fanTokens';
import { AddressSection } from '../AddressSection';
import { ProfileSection } from '../ProfileSection';

export function FanTokenAuctionCard() {
  const { isFetching: isFetchingAuctions, data: contactsWithAuction } = useFanTokens({
    enabled: true
  });

  const currentTime = new Date();

  return (
    <Card
      elevation={3}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: '15px',
        width: 350,
        maxHeight: 175,
        padding: 1
      }}>
      <CardHeader
        title="Ⓜ️ Fan Token Auction"
        titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
        sx={{ padding: 1, paddingBottom: 0 }}
      />
      <CardContent sx={{ padding: 1 }}>
        {isFetchingAuctions ? (
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '15px' }} />
        ) : contactsWithAuction && contactsWithAuction.length > 0 ? (
          <Box
            p={0.5}
            display="flex"
            gap={2}
            sx={{
              overflowX: 'scroll',
              scrollbarWidth: 'none',
              '&-ms-overflow-style:': {
                display: 'none'
              },
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}>
            {contactsWithAuction.map((contactWithAuction) => (
              <Card
                elevation={2}
                key={`contact_auction_card:${contactWithAuction.contact.data.address}`}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '15px',
                  minWidth: 220,
                  height: 100,
                  p: 0.5
                }}>
                <CardContent
                  sx={{
                    p: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                  <Stack justifyContent="flex-start" spacing={1}>
                    <Box
                      display="flex"
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center">
                      <Typography variant="caption">
                        Supply: <b>{contactWithAuction.auction.auctionSupply}</b>
                      </Typography>
                      <Chip
                        size="small"
                        clickable
                        component="a"
                        href={
                          contactWithAuction.auction.launchCastUrl ??
                          `https://www.airstack.xyz/users/fc_fname:${contactWithAuction.auction.farcasterUsername}`
                        }
                        target="_blank"
                        {...(new Date(contactWithAuction.auction.estimatedStartTimestamp) <=
                        currentTime
                          ? {
                              icon: <Circle color="success" sx={{ width: 10, height: 10 }} />,
                              label: (
                                <Typography variant="caption">
                                  <b>live</b>
                                </Typography>
                              )
                            }
                          : {
                              icon: <Circle color="warning" sx={{ width: 10, height: 10 }} />,
                              label: (
                                <Typography variant="caption">
                                  in{' '}
                                  <b>
                                    {countdown(contactWithAuction.auction.estimatedStartTimestamp)}
                                  </b>
                                </Typography>
                              )
                            })}
                      />
                    </Box>
                    {contactWithAuction.contact.data.profile ? (
                      <ProfileSection
                        maxWidth={200}
                        profile={contactWithAuction.contact.data.profile}
                      />
                    ) : (
                      <AddressSection maxWidth={200} identity={contactWithAuction.contact.data} />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography variant="caption">No auction available among your contacts</Typography>
        )}
      </CardContent>
    </Card>
  );
}
