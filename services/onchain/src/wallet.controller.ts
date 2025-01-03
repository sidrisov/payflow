import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpException,
  HttpStatus,
  OnModuleInit
} from '@nestjs/common';
import {
  Address,
  http,
  Hex,
  PublicClient,
  createPublicClient,
  Chain,
  Transport
} from 'viem';
import { UserOperationCall } from 'viem/account-abstraction';
import {
  base,
  optimism,
  degen,
  arbitrum,
  mainnet,
  baseSepolia
} from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { generateWallet, sendTransactionWithSession } from '@payflow/common';

import { wagmiConfig } from './utils/wagmi';
import * as pimlico from '@payflow/common';

@Controller('wallet')
export class WalletController implements OnModuleInit {
  private readonly clients: Record<number, PublicClient<Transport, Chain>>;

  constructor() {
    const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

    this.clients = {
      [mainnet.id as number]: createPublicClient({
        chain: mainnet,
        transport: http()
      }) as PublicClient<Transport, Chain>,
      [base.id as number]: createPublicClient({
        chain: base,
        transport: http()
      }) as PublicClient<Transport, Chain>,
      [baseSepolia.id as number]: createPublicClient({
        chain: baseSepolia,
        transport: http(
          `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        )
      }) as PublicClient<Transport, Chain>,
      [optimism.id as number]: createPublicClient({
        chain: optimism,
        transport: http()
      }) as PublicClient<Transport, Chain>,
      [degen.id as number]: createPublicClient({
        chain: degen,
        transport: http()
      }) as PublicClient<Transport, Chain>,
      [arbitrum.id as number]: createPublicClient({
        chain: arbitrum,
        transport: http()
      }) as PublicClient<Transport, Chain>
    };
  }

  onModuleInit() {
    // Initialize Pimlico when the module starts
    pimlico.initialize({
      apiKey: process.env.PIMLICO_API_KEY!,
      sponsoredEnabled: process.env.PIMLICO_SPONSORED_ENABLED === 'true',
      mainnetPolicies:
        process.env.PIMLICO_SPONSORED_POLICY_MAINNET?.split(',') || [],
      testnetPolicies:
        process.env.PIMLICO_SPONSORED_POLICY_SEPOLIA?.split(',') || []
    });

    console.log('Pimlico paymaster initialized');
  }

  @Get('generate')
  async generateWallet(
    @Query('owners') owners: Address | Address[],
    @Query('nonce') nonce: string
  ) {
    const chainIds = [base.id, optimism.id, degen.id, arbitrum.id];
    const ownersArray = Array.isArray(owners) ? owners : [owners];

    const wallets = await generateWallet(
      wagmiConfig,
      ownersArray as Address[],
      nonce,
      chainIds
    );

    if (wallets.length !== chainIds.length) {
      throw new Error('Failed to calculate wallets');
    }

    return wallets;
  }

  @Post('execute')
  async executeSessionCall(
    @Body()
    body: {
      address: Address;
      chainId: number;
      session: {
        sessionId: Hex;
        sessionKey: Hex;
      };
      calls: UserOperationCall[];
    }
  ) {
    const {
      chainId,
      address,
      session: { sessionId, sessionKey },
      calls
    } = body;

    console.log('Processing session call', {
      chainId,
      address,
      sessionId,
      calls
    });

    const client = this.clients[chainId];

    if (!client) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Unsupported chainId: ${chainId}`
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const sessionKeyAccount = privateKeyToAccount(sessionKey);

    console.log(sessionKeyAccount, calls);

    const txHash = await sendTransactionWithSession(
      client,
      address,
      {
        sessionId,
        sessionKey: sessionKeyAccount
      },
      calls,
      {
        sponsoredTx: true
      }
    );

    return {
      status: 'success',
      txHash
    };
  }
}
