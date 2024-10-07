/// <reference types="node" />

import dotenv from 'dotenv';
import axios from 'axios';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
): Promise<ChannelMetrics[]> {
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
        return isMember ? null : channel;
      })
    );

    return nonMemberChannels.filter((channel): channel is ChannelMetrics => channel !== null);
  } catch (error) {
    console.error('Error fetching channel metrics:', error);
    return [];
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
    .parse();

  const { identifier, minCasts, minReplies } = argv;

  const frequentChannels = await getFrequentChannels(identifier, minCasts, minReplies);

  console.log('Frequent channels (not a member):');
  frequentChannels.forEach((channel) => {
    console.log(
      `Channel: ${channel.channelID}, Casts: ${channel.casts}, Replies: ${channel.replies}`
    );
  });
}

main().catch((error) => console.error('Main error:', error.message));
