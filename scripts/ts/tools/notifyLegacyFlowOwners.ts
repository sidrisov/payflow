import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface User {
  username: string;
  fid: number;
  wallet: string;
}

// Read users from JSON file
const usersFilePath = path.join(__dirname, 'users_test.json');
const users: User[] = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

const messageTemplate1 = (username: string, wallet: string, balance: string) => `Hey @${username} 👋🏻

I'm the founder of @payflow. Thanks so much for using Payflow!

I'm removing the code supporting legacy payment flows.
This will remove few dependencies and improve loading time, 
especially when it's launched on farcaster clients as mini-app.

Please, migrate your funds from legacy payment flow within the next 2 weeks 🙏🏻

To migrate:
- log into Payflow
- follow the prompts to set up a new payment flow
- follow the cast above to migrate your funds

If you don't migrate:
- it will be archived on @payflow
- you won't be able to use it directly in the app
- but still be accessible on app.safe.global

Your balance: ~${balance} USD, check more details:
https://zapper.xyz/account/${wallet}?tab=portfolio

Need help? Contact me anytime
Sinaver

https://warpcast.com/sinaver.eth/0xc909c30e`;

const messageTemplate2 = (username: string, wallet: string, balance: string) => `Hey @${username} 👋🏻

I'm following up on my previous message.
Please, migrate your funds from legacy payment flow within a week.

Your balance: ~${balance} USD, you can also check tokens portfolio on Zapper:
https://zapper.xyz/account/${wallet}?tab=portfolio

Need help? Contact me anytime

Thanks, Sinaver from @payflow

https://warpcast.com/sinaver.eth/0xc909c30e`;

const url = 'https://api.warpcast.com/v2/ext-send-direct-cast';

async function sendDirectCast(user: User, balance: number, idempotencyKey: string): Promise<void> {
  const balanceStr = balance.toFixed(2);
  const message = messageTemplate2(user.username, user.wallet, balanceStr);

  console.log(`Sending direct cast to @${user.username} (FID ${user.fid}): ${message}`);
  try {
    const response = await axios.put(
      url,
      {
        recipientFid: user.fid,
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
      console.log(`Success: @${user.username} (FID ${user.fid})`);
    } else {
      console.log(`Failed: @${user.username} (FID ${user.fid}), Status: ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error: @${user.username} (FID ${user.fid}), ${error.response?.status || 'Unknown'}, ${
          error.response?.data?.message || error.message
        }`
      );
    } else {
      console.error(`Error: @${user.username} (FID ${user.fid}), Unknown error`);
    }
  }
}

async function getZapperBalance(wallet: string): Promise<number> {
  const zapperUrl = `https://api.zapper.xyz/v2/balances/tokens?addresses[]=${wallet}&networks[]=base&networks[]=optimism`;

  try {
    const response = await axios.get(zapperUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.ZAPPER_API_KEY + ':').toString('base64')}`
      }
    });

    let totalBalanceUSD = 0;
    for (const address in response.data) {
      const tokens = response.data[address];
      tokens.forEach((tokenData: any) => {
        totalBalanceUSD += tokenData.token.balanceUSD;
      });
    }

    return totalBalanceUSD;
  } catch (error) {
    console.error(`Error fetching Zapper balance for ${wallet}:`, error);
    return Number.NaN;
  }
}

async function main() {
  const idempotencyKey = uuidv4();
  const totalUsers = users.length;
  let processed = 0;
  let skipped = 0;

  for (const user of users) {
    const balance = await getZapperBalance(user.wallet);
    if (Number.isNaN(balance) || balance < 1) {
      console.log(
        `Skipping @${user.username} (FID ${user.fid}): Balance ${
          Number.isNaN(balance) ? 'N/A' : '< $1'
        }`
      );
      skipped++;
      continue;
    }
    await sendDirectCast(user, balance, idempotencyKey);
    processed++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(
    `Process completed. Total: ${totalUsers}, Processed: ${processed}, Skipped: ${skipped}`
  );
}

main().catch((error) => console.error('Main error:', error.message));
