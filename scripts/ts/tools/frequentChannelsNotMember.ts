/// <reference types="node" />

import dotenv from 'dotenv';
import axios from 'axios';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

interface ChannelMetrics {
  date: string;
  channelID: string;
  casts: number;
  replies: number;
  receivedReplies: number;
  receivedLikes: number;
  receivedRecasts: number;
  contribution: number;
}

interface ChannelMemberResponse {
  result: {
    members: { fid: number; memberAt: number }[];
  };
}

interface ChannelInfo {
  id: string;
  name: string;
  leadFid: number;
}

async function getFidFromUsername(username: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://api.warpcast.com/v2/user-by-username?username=${username}`
    );
    return response.data.result.user.fid;
  } catch (error) {
    console.error(`Error fetching FID for username ${username}:`, error);
    return null;
  }
}

async function getUsernameFromFid(fid: number): Promise<string | null> {
  try {
    const response = await axios.get(`https://api.warpcast.com/v2/user-by-fid?fid=${fid}`);
    return response.data.result.user.username;
  } catch (error) {
    console.error(`Error fetching username for FID ${fid}:`, error);
    return null;
  }
}

async function getFrequentChannels(
  identifier: string,
  minCasts: number,
  minReplies: number
): Promise<(ChannelMetrics & { channelName: string; channelOwner: string; ownerFid: number })[]> {
  let fid: number;
  let username: string;

  if (isNaN(Number(identifier))) {
    // Identifier is a username
    username = identifier;
    const fetchedFid = await getFidFromUsername(username);
    if (!fetchedFid) {
      throw new Error(`Could not find FID for username: ${username}`);
    }
    fid = fetchedFid;
  } else {
    // Identifier is an FID
    fid = Number(identifier);
    const fetchedUsername = await getUsernameFromFid(fid);
    if (!fetchedUsername) {
      throw new Error(`Could not find username for FID: ${fid}`);
    }
    username = fetchedUsername;
  }

  try {
    const response = await axios.get(
      `https://api.nanograph.xyz/farcaster/user/${username}/metrics`
    );
    const metrics: ChannelMetrics[] = response.data;

    const frequentChannels = metrics.filter(
      (channel) =>
        channel.channelID !== '' && channel.casts >= minCasts && channel.replies >= minReplies
    );

    const nonMemberChannels = await Promise.all(
      frequentChannels.map(async (channel) => {
        const isMember = await isChannelMember(fid, channel.channelID);
        if (isMember) return null;

        const channelInfo = await getChannelInfo(channel.channelID);
        const channelOwner = await getUsernameFromFid(channelInfo.leadFid);

        return {
          ...channel,
          channelName: channelInfo.name,
          channelOwner: channelOwner || 'Unknown',
          ownerFid: channelInfo.leadFid
        };
      })
    );

    return nonMemberChannels.filter(
      (
        channel
      ): channel is ChannelMetrics & {
        channelName: string;
        channelOwner: string;
        ownerFid: number;
      } => channel !== null
    );
  } catch (error) {
    console.error('Error fetching channel metrics:', error);
    return [];
  }
}

async function getChannelInfo(channelId: string): Promise<ChannelInfo> {
  try {
    const response = await axios.get(`https://api.warpcast.com/v1/channel?channelId=${channelId}`);
    const { id, name, leadFid } = response.data.result.channel;
    return { id, name, leadFid };
  } catch (error) {
    console.error(`Error fetching channel info for ${channelId}:`, error);
    return { id: channelId, name: 'Unknown', leadFid: 0 };
  }
}

async function isChannelMember(fid: number, channelId: string): Promise<boolean> {
  try {
    const response = await axios.get<ChannelMemberResponse>(
      `https://api.warpcast.com/fc/channel-members?channelId=${channelId}&fid=${fid}`
    );
    return response.data.result.members.length > 0;
  } catch (error) {
    console.error(`Error checking channel membership for ${channelId}:`, error);
    return false;
  }
}

async function sendDirectCastToChannelOwner(
  channel: ChannelMetrics & { channelName: string; channelOwner: string; ownerFid: number },
  username: string,
  test: boolean = true
): Promise<void> {
  const url = 'https://api.warpcast.com/v2/ext-send-direct-cast';
  const idempotencyKey = uuidv4();

  const message = `Hey @${channel.channelOwner} 👋

I've been active in /${channel.channelID} channel (${channel.casts} casts, ${channel.replies} replies) and would love to become a member.

Could you please invite @${username} to join /${channel.channelID}?
Also, let me know if there are any specific membership criteria.

Thanks for considering!`;

  console.log(`Sending direct cast to @${channel.channelOwner}: \n${message}`);

  if (test) {
    console.log('Test mode, skipping actual request');
    return;
  }

  try {
    const response = await axios.put(
      url,
      {
        recipientFid: channel.ownerFid,
        message,
        idempotencyKey
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WARPCAST_BEARER_TOKEN}`
        }
      }
    );

    if (response.status === 200) {
      console.log(`Success: Message sent to @${channel.channelOwner}`);
    } else {
      console.log(`Failed: Message to @${channel.channelOwner}, Status: ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error: Message to @${channel.channelOwner}, ${error.response?.status || 'Unknown'}, ${
          error.response?.data?.message || error.message
        }`
      );
    } else {
      console.error(`Error: Message to @${channel.channelOwner}, Unknown error`);
    }
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('identifier', {
      type: 'string',
      description: 'Farcaster ID or username',
      demandOption: true
    })
    .option('minCasts', {
      type: 'number',
      description: 'Minimum number of casts',
      default: 5
    })
    .option('minReplies', {
      type: 'number',
      description: 'Minimum number of replies',
      default: 10
    })
    .option('test', {
      type: 'boolean',
      description: 'Run in test mode (no actual messages sent)',
      default: true
    })
    .option('ask-membership', {
      type: 'boolean',
      description: 'Send direct casts to channel owners asking for membership',
      default: false
    })
    .parse();

  const { identifier, minCasts, minReplies, test, askMembership } = argv;

  const frequentChannels = await getFrequentChannels(identifier, minCasts, minReplies);

  console.log('Frequent channels (not a member):');
  for (const channel of frequentChannels) {
    console.log(
      `Channel: /${channel.channelID} (${channel.channelName}), Owner: ${channel.channelOwner} (FID: ${channel.ownerFid}), Casts: ${channel.casts}, Replies: ${channel.replies}`
    );
  }

  if (askMembership) {
    console.log('\nSending membership requests:');
    for (const channel of frequentChannels) {
      console.log(`\nRequesting membership for channel: ${channel.channelName}`);
      await sendDirectCastToChannelOwner(channel, identifier, test);

      // Add a delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    console.log('\nMembership requests completed.');
  } else {
    console.log('\nNo membership requests sent. Use --ask-membership to send requests.');
  }
}

main().catch((error) => console.error('Main error:', error.message));
