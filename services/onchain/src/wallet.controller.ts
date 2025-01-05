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
  Hex,
  PublicClient,
  Chain,
  Transport} from 'viem';
import { UserOperationCall } from 'viem/account-abstraction';
import { base, optimism, degen, arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { generateWallet, sendTransactionWithSession } from '@payflow/common';

import { wagmiConfig } from './utils/wagmi';
import * as pimlico from '@payflow/common';
import { getBalance, getPublicClient } from '@wagmi/core';

import { config } from 'dotenv';

config();

@Controller('wallet')
export class WalletController implements OnModuleInit {
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

    const client = getPublicClient(wagmiConfig, { chainId: chainId as any });
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

    try {
      const txHash = await sendTransactionWithSession(
        client as PublicClient<Transport, Chain>,
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
    } catch (error) {
      console.error('Error sending transaction with session', error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to process transaction'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('/token/balance')
  async checkTokenBalance(
    @Query('address') address: Address,
    @Query('chainId') chainId: number,
    @Query('token') token?: Address
  ) {
    const chain = wagmiConfig.chains.find(
      (c) => Number(c.id) === Number(chainId)
    );
    if (!chain) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Unsupported chainId: ${chainId}`
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const balance = await getBalance(wagmiConfig, {
      address,
      chainId: chain.id,
      token
    });

    return {
      balance: balance.value.toString(),
      formatted: balance.formatted,
      symbol: balance.symbol,
      decimals: balance.decimals
    };
  }
}
