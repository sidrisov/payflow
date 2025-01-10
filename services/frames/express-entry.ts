import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import bodyParser from 'body-parser';
import { renderPage } from 'vike/server';
import { htmlToImage } from './utils/image';
import axios from 'axios';
import { IdentityType } from './types/ProfleType';
import dotenv from 'dotenv';
import { PaymentType } from '@payflow/common';
import { paymentHtml } from './components/Payment';
import { Address, Chain } from 'viem';
import { arbitrum, base, degen, ham, mode, optimism, worldchain, zora } from 'viem/chains';
import { fetchTokenPrices } from './utils/prices';
import { TokenPrices } from '@payflow/common';
import { XmtpOpenFramesRequest, validateFramesPost } from '@xmtp/frames-validator';
import { normalizeNumberPrecision } from './utils/format';
import { createJarHtml } from './components/CreateJar';
import { buyStorageEntryHtml, buyStorageHtml } from './components/BuyStorage';
import { StorageUsage } from './types/StorageUsageType';
import { mintHtml } from './components/Mint';
import { fetchMintData } from './utils/mint';
import { buyFanTokenEntryHtml } from './components/BuyFanToken';
import { buyHypersubEntryHtml } from './components/Subsribe';
import { fetchSubscribers } from '@withfabric/protocol-sdks/stpv2';
import { configureFabricSDK } from '@withfabric/protocol-sdks';
import { wagmiConfig } from './utils/wagmi';
import { API_URL } from './utils/constants';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const root = __dirname;

const balanceParams = ['eth', 'usdc', 'degen'];
const oneDayInSeconds = 24 * 60 * 60;

const chains: Chain[] = [base, optimism, zora, arbitrum, mode, degen, ham, worldchain];

configureFabricSDK({ wagmiConfig });

const SUPPORTED_TOKENS = [
  'eth',
  'weth',
  'usdc',
  'eurc',
  'degen',
  'moxie',
  'higher',
  'onchain',
  'tn100x',
  'build',
  'doginme',
  'tybg',
  'nouns',
  'farther',
  'dog',
  'usdglo',
  'enjoy',
  'imagine',
  'op',
  'arb',
  'hunt',
  'masks',
  'cbBTC',
  'mfer',
  'talent',
  'clanker',
  'lum'
];

startServer();

async function startServer() {
  const app = express();
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

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

  app.get('/hypersub/subscribers/:chainId/:contractAddress', async (req, res) => {
    const chainId = req.params.chainId;
    const contractAddress = req.params.contractAddress;

    const accounts = Array.isArray(req.query.accounts) ? req.query.accounts : [req.query.accounts];

    try {
      const subscribers = await fetchSubscribers({
        contractAddress: contractAddress as Address,
        chainId: Number(chainId),
        accounts: accounts as Address[]
      });

      console.debug('Subscribers:', subscribers);

      // Convert BigInt values to strings before sending the response
      const serializedSubscribers = subscribers.map((sub) => ({
        ...sub,
        tokenId: sub.tokenId.toString(),
        rewardShares: sub.rewardShares.toString(),
        rewardBalance: sub.rewardBalance.toString()
      }));

      res.status(200).json(serializedSubscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
  });

  app.get('/images/payment/:refId/image.png', async (req, res) => {
    try {
      // Fetch payment from API
      const paymentResponse = await axios.get(`${API_URL}/api/payment/${req.params.refId}`);
      const payment = paymentResponse.data;

      // Calculate token amount or USD amount if missing
      if (payment.tokenAmount === undefined && payment.usdAmount !== undefined && payment.token) {
        payment.tokenAmount = Number.parseFloat(
          normalizeNumberPrecision(payment.usdAmount / TOKEN_PRICES[payment.token])
        );
      }

      if (payment.usdAmount === undefined && payment.tokenAmount !== undefined && payment.token) {
        payment.usdAmount = Number.parseFloat(
          normalizeNumberPrecision(payment.tokenAmount * TOKEN_PRICES[payment.token])
        );
      }

      const titleBase64 = req.query.title;
      const theme = req.query.theme ?? 'light';
      const title =
        titleBase64 &&
        (titleBase64 as string).length > 0 &&
        decodeURIComponent(titleBase64 as string);

      // Fetch identity data
      const response = await axios.get(
        `${API_URL}/api/user/identities/${payment.receiver?.identity || payment.receiverAddress}`
      );
      let identityData = (
        response.data !== '' ? response.data : { identity: payment.receiverAddress }
      ) as IdentityType;

      console.debug('Payment: ', payment);

      const image = await htmlToImage(
        paymentHtml(identityData, payment, title as any, theme as any),
        'landscape',
        3 / 2
      );
      res.setHeader('Cache-Control', 'max-age=120').type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving payment or identity data');
    }
  });

  app.get('/images/profile/:identity/payment.png', async (req, res) => {
    const identity = req.params.identity as Address;
    let payment: PaymentType;

    try {
      if (req.query.refId) {
        // Fetch payment from API
        const response = await axios.get(`${API_URL}/api/payment/${req.query.refId}`);
        payment = response.data;

        // Calculate token amount or USD amount if missing
        if (payment.tokenAmount === undefined && payment.usdAmount !== undefined && payment.token) {
          payment.tokenAmount = Number.parseFloat(
            normalizeNumberPrecision(payment.usdAmount / TOKEN_PRICES[payment.token])
          );
        }

        if (payment.usdAmount === undefined && payment.tokenAmount !== undefined && payment.token) {
          payment.usdAmount = Number.parseFloat(
            normalizeNumberPrecision(payment.tokenAmount * TOKEN_PRICES[payment.token])
          );
        }
      } else {
        // Use query parameters if no referenceId
        payment = {
          chainId: Number(req.query.chainId),
          token: req.query.token,
          usdAmount: req.query.usdAmount,
          tokenAmount: req.query.tokenAmount,
          status: req.query.status
        } as unknown as PaymentType;

        // Calculate missing amounts
        if (payment.tokenAmount === undefined && payment.usdAmount !== undefined && payment.token) {
          payment.tokenAmount = Number.parseFloat(
            normalizeNumberPrecision(payment.usdAmount / TOKEN_PRICES[payment.token])
          );
        }

        if (payment.usdAmount === undefined && payment.tokenAmount !== undefined && payment.token) {
          payment.usdAmount = Number.parseFloat(
            normalizeNumberPrecision(payment.tokenAmount * TOKEN_PRICES[payment.token])
          );
        }
      }

      const titleBase64 = req.query.title;
      const theme = req.query.theme ?? 'light';
      const title =
        titleBase64 &&
        (titleBase64 as string).length > 0 &&
        decodeURIComponent(titleBase64 as string);

      // Fetch identity data
      const response = await axios.get(`${API_URL}/api/user/identities/${identity}`);
      let identityData = (response.data !== '' ? response.data : { identity }) as IdentityType;

      console.debug('Payment: ', payment);

      const image = await htmlToImage(
        paymentHtml(identityData, payment, title as any, theme as any),
        'landscape'
      );
      res.setHeader('Cache-Control', 'max-age=120').type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving payment or identity data');
    }
  });

  app.get('/images/mint.png', async (req, res) => {
    try {
      const provider = req.query.provider as string;
      const chainId = parseInt(req.query.chainId as string);
      const contract = req.query.contract as Address;
      const tokenId = req.query.tokenId ? parseInt(req.query.tokenId as string) : undefined;

      const mintData = await fetchMintData(provider, chainId, contract, tokenId);
      if (!mintData) {
        res.status(500).send('Failed to load mint data');
        return;
      }

      console.debug(mintData);

      const image = await htmlToImage(mintHtml(mintData), 'portrait');
      res
        .setHeader('Cache-Control', `max-age=${60 * 60 * 1000}`)
        .type('png')
        .send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to generate mint image');
    }
  });

  app.get('/images/storage.png', async (req, res) => {
    try {
      const image = await htmlToImage(buyStorageEntryHtml(chains, SUPPORTED_TOKENS), 'landscape');
      res.setHeader('Cache-Control', `max-age=${oneDayInSeconds}`).type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/fan.png', async (_, res) => {
    try {
      const image = await htmlToImage(buyFanTokenEntryHtml(chains, SUPPORTED_TOKENS), 'landscape');
      res.setHeader('Cache-Control', `max-age=${oneDayInSeconds}`).type('png').send(image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving profile data');
    }
  });

  app.get('/images/hypersub.png', async (_, res) => {
    try {
      const image = await htmlToImage(buyHypersubEntryHtml(chains, SUPPORTED_TOKENS), 'landscape');
      res.setHeader('Cache-Control', `max-age=${oneDayInSeconds}`).type('png').send(image);
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
      const image = await htmlToImage(buyStorageHtml(identityData, storageData), 'landscape');
      res.setHeader('Cache-Control', 'max-age=60').type('png').send(image);
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

  /* app.get('/images/jar/:uuid/image.png', async (req, res) => {
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
  }); */

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
