import { Circle } from '@mui/icons-material';
import { Card, CardContent, Box, Stack, Typography, Chip, Skeleton, Button } from '@mui/material';
import { countdown } from '../../utils/date';
import { useFanTokens } from '../../utils/queries/fanTokens';
import { AddressSection } from '../AddressSection';
import { ProfileSection } from '../ProfileSection';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useAvailableMoxieRewards as useMoxieRewards } from '../../utils/queries/moxie';
import { useIdentity } from '../../utils/queries/profiles';
import { ClaimMoxieRewardsDialog } from '../dialogs/ClaimMoxieRewardsDialog';
import { useSearchParams } from 'react-router-dom';
import InfoCard, { InfoStack } from './InfoCard';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { toast } from 'react-toastify';

export function MoxieInfoCard() {
  const { isMiniApp } = useContext(ProfileContext);

  const accessToken = useSearchParams()[0].get('access_token') ?? undefined;

  const { profile } = useContext(ProfileContext);

  const { data: identity } = useIdentity(profile?.identity);

  const fid =
    Number(identity?.meta?.socials?.find((s) => s.dappName === FARCASTER_DAPP)?.profileId) ||
    undefined;

  const {
    isFetching: isFetchingRewards,
    data: rewards,
    error: rewardsError
  } = useMoxieRewards(fid);

  const [openClaimRewardsDialog, setOpenClaimRewardsDialog] = useState<boolean>(false);

  const { isFetching: isFetchingAuctions, data: contactsWithAuction } = useFanTokens({
    enabled: true,
    accessToken
  });

  const currentTime = new Date();

  return (
    <InfoCard title="Ⓜ️ Moxie Center">
      <InfoStack title="Claimable /  Total Rewards">
        {isFetchingRewards || !fid ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : rewards ? (
          <Stack
            height={55}
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
              {formatAmountWithSuffix(normalizeNumberPrecision(rewards.availableClaimAmount))} /{' '}
              {formatAmountWithSuffix(normalizeNumberPrecision(rewards.claimedAmount))}
            </Typography>
            {rewards.availableClaimAmount > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setOpenClaimRewardsDialog(true)}
                sx={{ borderRadius: 3 }}>
                Claim
              </Button>
            )}
          </Stack>
        ) : (
          <Typography variant="subtitle2" color="inherit">
            {!rewardsError ? (
              'Unable to fetch reward information'
            ) : (
              <>
                {rewardsError.message}
                {'! '}
                <a
                  href="https://warpcast.com/~/inbox/create/19129"
                  target="_blank"
                  style={{ color: 'inherit' }}>
                  Contact Support
                </a>{' '}
                💬
              </>
            )}
          </Typography>
        )}
      </InfoStack>
      <InfoStack title="Auctions among contacts">
        {isFetchingAuctions ? (
          <Skeleton
            variant="rectangular"
            height={100}
            width="100%"
            sx={{ margin: 1, borderRadius: '15px' }}
          />
        ) : contactsWithAuction && contactsWithAuction.length > 0 ? (
          <Box
            alignSelf="stretch"
            display="flex"
            gap={1}
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
                elevation={3}
                key={`contact_auction_card:${contactWithAuction.contact.data.address}`}
                sx={{
                  borderRadius: '15px',
                  minWidth: 175,
                  maxHeight: 100,
                  m: 1,
                  p: 0.5
                }}>
                <CardContent
                  sx={{
                    p: 0.5,
                    '&:last-child': {
                      paddingBottom: 0.5
                    },
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
                        {...(isMiniApp
                          ? {
                              onClick: () => {
                                const link = `https://www.airstack.xyz/users/fc_fname:${contactWithAuction.auction.farcasterUsername}`;
                                copyToClipboard(link);
                                toast.success('Airstack auction link copied!', { autoClose: 2000 });
                              }
                            }
                          : {
                              component: 'a',
                              href: `https://www.airstack.xyz/users/fc_fname:${contactWithAuction.auction.farcasterUsername}`,
                              target: '_blank'
                            })}
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
          <Typography variant="subtitle2" textAlign="center">
            No auctions available among contacts
          </Typography>
        )}
      </InfoStack>

      {openClaimRewardsDialog && fid && (
        <ClaimMoxieRewardsDialog
          fid={fid}
          claimableRewardsAmount={rewards?.availableClaimAmount}
          open={openClaimRewardsDialog}
          onClose={() => {
            setOpenClaimRewardsDialog(false);
          }}
        />
      )}
    </InfoCard>
  );
}
