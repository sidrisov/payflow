import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import bodyParser from 'body-parser';
import { renderPage } from 'vike/server';
import { test } from './components/test';
import { htmlToImage } from './utils/image';
import axios from 'axios';
import { profileHtml } from './components/Profile';
import { IdentityType, ProfileType } from './types/ProfleType';

import dotenv from 'dotenv';
import { welcomeProfileHtml } from './components/WelcomeProfile';
import { invitedHtml } from './components/Invited';
import { notInvitedHtml } from './components/NotInvited';
import { giftHtml } from './components/Gift';
import { giftLeaderboardHtml } from './components/GiftLeaderboard';
import { GiftProfileType } from './types/GiftType';
import { BalanceType } from './types/BalanceType';
import { PaymentType } from './types/PaymentType';
import { payProfileHtml } from './components/PayProfile';
import { Address, createPublicClient, http, keccak256, toBytes } from 'viem';
import { arbitrum, base, degen, mode, optimism } from 'viem/chains';
import { signerToSafeSmartAccount } from './utils/permissionless_forked/signerToSafeSmartAccount';
import { ENTRYPOINT_ADDRESS_V06, isSmartAccountDeployed } from 'permissionless';
import { SmartAccountSigner } from 'permissionless/accounts';
import { FlowWalletType, JarType } from './types/FlowType';
import { jarHtml } from './components/Jar';
import { fetchTokenPrices } from './utils/prices';
import { TokenPrices } from './utils/erc20contracts';
import { getAssetBalances, getFlowAssets, getTotalBalance } from './utils/balances';
import { XmtpOpenFramesRequest, validateFramesPost } from '@xmtp/frames-validator';
import { normalizeNumberPrecision } from './utils/format';
import { createJarHtml } from './components/CreateJar';
import { giftStorageHtml } from './components/GiftStorage';
import { StorageUsage } from './types/StorageUsageType';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const root = __dirname;

const API_URL = process.env.VITE_PAYFLOW_SERVICE_API_URL;

const balanceParams = ['eth', 'usdc', 'degen'];

startServer();

async function startServer() {
  const app = express();
  app.use(express.static('assets'));

  if (isProduction) {
    app.use(express.static(`${root}/dist/client`));
  } else {
    // Instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We should instantiate it *only* in development. (It isn't needed in production
    // and would unnecessarily bloat our server in production.)
    const vite = await import('vite');
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true }
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  app.use(bodyParser.json());

  // TODO: for now re-use frame service, move to separate onchain-service,
  // once there are enough APIs to handle
  app.get('/wallets', async (req, res) => {
    try {
      const owners = Array.isArray(req.query.owners) ? req.query.owners : [req.query.owners];
      const saltNonce = req.query.saltNonce as string;
      const chains = [base, optimism, degen, arbitrum, mode];
      const safeVersion = '1.4.1';

      const wallets: FlowWalletType[] = [];

      const promises = chains.map(async (chain) => {
        const client = createPublicClient({
          chain,
          transport: http()
        });

        if (client) {
          const safeAccount = await signerToSafeSmartAccount(client as any, {
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            signer: {} as SmartAccountSigner,
            owners: owners as Address[],
            safeVersion,
            saltNonce: BigInt(keccak256(toBytes(saltNonce)))
          });

          const predictedAddress = safeAccount.address;
          const isSafeDeployed = await isSmartAccountDeployed(client, predictedAddress);

          wallets.push({
            address: predictedAddress,
            network: chain.id,
            version: safeVersion,
            deployed: isSafeDeployed
          });
        }
      });

      await Promise.all(promises);

      console.log('Wallets: ', wallets);

      if (wallets.length === chains.length) {
        res.status(200).json(wallets);
      } else {
        res.status(500).send('Failed to calculate wallets');
      }
    } catch (error) {
      console.error('Error calculating wallets:', error);
      res.status(500).send('Failed to calculate wallets');
    }
  });

  // handling frames image generation
  app.get('/images/welcome.png', async (_, res) => {
    const image = await htmlToImage(test('Payflow'), 'landscape');
    res.type('png').send(image);
  });

  app.get('/images/profile/:fname/welcome.png', async (req, res) => {
    const fname = req.params.fname;

    const image = await htmlToImage(welcomeProfileHtml(fname), 'landscape');
    res.type('png').send(image);
  });

  app.get('/images/profile/invited.png', async (_, res) => {
    const image = await htmlToImage(invitedHtml(), 'landscape');
    res.type('png').send(image);
  });

  app.get('/images/profile/notinvited.png', async (_, res) => {
    const image = await htmlToImage(notInvitedHtml(), 'landscape');
    res.type('png').send(image);
  });

  app.get('/images/profile/:identity/image.png', async (req, res) => {
    const identity = req.params.identity;

    try {
      const response = await axios.get(`${API_URL}/api/user/${identity}`);
      const profileData = response.data as ProfileType;
      const image = await htmlToImage(profileHtml(profileData), 'landscape');
      res.type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/profile/:identity/payment.png', async (req, res) => {
    const identity = req.params.identity as Address;
    const step = req.query.step;
    const payment = {
      chainId: Number(req.query.chainId),
      token: req.query.token,
      usdAmount: req.query.usdAmount,
      tokenAmount: req.query.tokenAmount,
      status: req.query.status
    } as PaymentType;

    const entryTitleBase64 = req.query.entryTitle;

    const entryTitle =
      entryTitleBase64 &&
      (entryTitleBase64 as string).length > 0 &&
      decodeURIComponent(entryTitleBase64 as string);

    if (!payment.tokenAmount && payment.usdAmount && payment.token) {
      payment.tokenAmount = normalizeNumberPrecision(
        Number.parseFloat(payment.usdAmount) / TOKEN_PRICES[payment.token]
      ).toString();
    }

    if (!payment.usdAmount && payment.tokenAmount && payment.token) {
      payment.usdAmount = normalizeNumberPrecision(
        Number.parseFloat(payment.tokenAmount) * TOKEN_PRICES[payment.token]
      ).toString();
    }

    console.debug('Payment: ', payment);

    try {
      const response = await axios.get(`${API_URL}/api/user/identities/${identity}`);
      let identityData = (response.data !== '' ? response.data : { identity }) as IdentityType;
      const image = await htmlToImage(
        payProfileHtml(identityData, step as any, payment, entryTitle as any),
        'landscape'
      );
      res.setHeader('Cache-Control', 'max-age=60').type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/profile/fid/:fid/storage.png', async (req, res) => {
    const fid = req.params.fid as Address;

    try {
      const identityResponse = await axios.get(`${API_URL}/api/user/identities/fid/${fid}`);
      const identityData = (
        identityResponse.data !== '' ? identityResponse.data : { identity: `fid/${fid}` }
      ) as IdentityType;

      const storageResponse = await axios.get(`${API_URL}/api/user/storage/fid/${fid}`);
      const storageData = storageResponse.data as StorageUsage;
      const image = await htmlToImage(giftStorageHtml(identityData, storageData), 'landscape');
      res.setHeader('Cache-Control', 'max-age=60').type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/profile/:identity/balance.png', async (req, res) => {
    const identity = req.params.identity;
    const balances: BalanceType[] = [];
    Object.keys(req.query).forEach((key) => {
      if (balanceParams.includes(key)) {
        balances.push({ token: key, balance: req.query[key] as string });
      }
    });

    try {
      const response = await axios.get(`${API_URL}/api/user/${identity}`);
      const profileData = response.data as ProfileType;
      const image = await htmlToImage(profileHtml(profileData, balances), 'landscape');
      res.type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/profile/:identity/gift/image.png', async (req, res) => {
    const gifter = req.params.identity;
    const error = req.query.error?.toString();

    try {
      const gifterProfile = (await axios.get(`${API_URL}/api/user/${gifter}`)).data as ProfileType;

      const image = await htmlToImage(giftHtml(gifterProfile, undefined, error), 'landscape');
      res.type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/profile/:identity/gift/:contact/image.png', async (req, res) => {
    const gifter = req.params.identity;
    const gifted = req.params.contact;

    try {
      const gifterProfile = (await axios.get(`${API_URL}/api/user/${gifter}`)).data as ProfileType;
      const giftedProfile = (await axios.get(`${API_URL}/api/user/${gifted}`)).data as ProfileType;

      const image = await htmlToImage(giftHtml(gifterProfile, giftedProfile), 'landscape');
      res.type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/profile/:identity/gift/leaderboard.png', async (req, res) => {
    const identity = req.params.identity;

    try {
      const profile = (await axios.get(`${API_URL}/api/user/${identity}`)).data as ProfileType;

      const giftLeaderboard = (
        await axios.get(`${API_URL}/api/farcaster/frames/gift/${identity}/leaderboard`)
      ).data as GiftProfileType[];

      const image = await htmlToImage(giftLeaderboardHtml(profile, giftLeaderboard), 'landscape');
      res.type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/jar/create/image.png', async (_, res) => {
    try {
      const image = await htmlToImage(createJarHtml(), 'landscape');
      res.type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error generating create jar image');
    }
  });

  app.get('/images/jar/:uuid/image.png', async (req, res) => {
    const uuid = req.params.uuid;
    const step = req.query.step;
    const payment = {
      chainId: req.query.chainId ? parseInt(req.query.chainId as string) : undefined,
      token: req.query.token,
      usdAmount: req.query.usdAmount,
      tokenAmount: req.query.tokenAmount,
      status: req.query.status
    } as PaymentType;

    if (!payment.tokenAmount && payment.usdAmount && payment.token) {
      payment.tokenAmount = normalizeNumberPrecision(
        Number.parseFloat(payment.usdAmount) / TOKEN_PRICES[payment.token]
      ).toString();
    }

    if (!payment.usdAmount && payment.tokenAmount && payment.token) {
      payment.usdAmount = normalizeNumberPrecision(
        Number.parseFloat(payment.tokenAmount) * TOKEN_PRICES[payment.token]
      ).toString();
    }

    try {
      const jar = (await axios.get(`${API_URL}/api/flows/jar/${uuid}`)).data as JarType;

      const assets = getFlowAssets(jar.flow);
      const assetBalances = await getAssetBalances(assets, TOKEN_PRICES);
      const totalBalance = getTotalBalance(assetBalances);

      console.log(totalBalance);

      const image = await htmlToImage(
        jarHtml(jar, totalBalance, step as any, payment),
        'landscape'
      );
      res.setHeader('Cache-Control', 'max-age=60').type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving jar data');
    }
  });

  app.post('/xmtp/validate', async (req, res) => {
    try {
      const xmtpFrameRequest = req.body as XmtpOpenFramesRequest;

      console.debug('Verifying xmtp request message: ', xmtpFrameRequest);

      if (xmtpFrameRequest.clientProtocol.startsWith('xmtp')) {
        const xmtpFrameResponse = await validateFramesPost(xmtpFrameRequest);
        console.debug('Validated xmtp response message: ', xmtpFrameResponse);
        res.status(200).send(xmtpFrameResponse);
      } else {
        res.status(400).send('Frame Request not supported');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Error processing xmtp request message');
    }
  });

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all('*', async (req, res, next) => {
    const pageContextInit = { urlOriginal: req.originalUrl };
    const pageContext = await renderPage(pageContextInit);
    if (pageContext.httpResponse === null) return next();

    const { statusCode, contentType } = pageContext.httpResponse;
    res.status(statusCode).type(contentType);
    pageContext.httpResponse.pipe(res);
  });

  app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000, () => {
    console.log('Server listening on http://localhost:3000');
  });
}

// Placeholder for storing prices
export let TOKEN_PRICES: TokenPrices = {};

// Function to fetch prices from an API
const fetchPrices = async () => {
  try {
    TOKEN_PRICES = await fetchTokenPrices();
    console.log('Fetched prices: ', TOKEN_PRICES);
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
};

const initialDelay = 1000; // 5 seconds initial delay
const intervalDuration = 60000; // 1 minute interval

setTimeout(() => {
  fetchPrices();
  setInterval(fetchPrices, intervalDuration);
}, initialDelay);
