import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  parseEther,
  Address,
  Chain,
  Client,
  Transport,
  Hex,
  LocalAccount,
  toHex,
  toBytes,
  WalletClient,
  http,
  createWalletClient,
  Account,
  createPublicClient,
  PublicClient,
  encodeFunctionData,
  parseUnits,
  erc20Abi
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import {
  generateWallet as generateSmartWallet,
  sendTransaction,
  sendTransactionWithSession,
  manageSessions,
  generateWallet
} from '@payflow/common/src/wallet/safeWallet';
import {
  encodeValidationData,
  getPermissionId,
  getTimeFramePolicy,
  getValueLimitPolicy,
  getSpendingLimitsPolicy,
  OWNABLE_VALIDATOR_ADDRESS,
  Session,
  getSudoPolicy
} from '@rhinestone/module-sdk';

import { UserOperationCall } from 'viem/account-abstraction';
import { wagmiConfig } from 'src/utils/wagmi';
import { initialize } from '@payflow/common/src/paymaster/pimlico';

import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const zoraAdminMintAbi = [
  {
    name: 'adminMint',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
      { name: 'data', type: 'bytes' }
    ],
    outputs: []
  }
] as const;

describe('Safe Wallet', () => {
  // Test constants
  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  const TEST_OWNER_KEY = process.env.OWNER_KEY as Hex;
  const TEST_SESSION_KEY = process.env.SESSION_KEY as Hex;
  const TEST_SALT = 'test_salt_6';

  const USDC_TOKEN_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
  //const TEST_SALT = 'test_salt_7';
  const TEST_RECIPIENT =
    '0xBe914eE5AD86eE983C533e6fEd7C2EBE8F6b775f' as Address;

  const chain = base;
  const rpc = `https://${
    (chain.id as number) === (base.id as number)
      ? 'base-mainnet'
      : 'base-sepolia'
  }.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  // Test variables
  let account: LocalAccount;
  let sessionKey: LocalAccount;

  let client: PublicClient<Transport, Chain>;
  let safeAddress: Address;
  let walletClient: WalletClient<Transport, Chain, Account>;
  let session: Session;
  let sessionId: Hex;

  beforeAll(() => {
    initialize({
      apiKey: process.env.PIMLICO_API_KEY!,
      sponsoredEnabled: process.env.PIMLICO_SPONSORED_ENABLED === 'true',
      mainnetPolicies: JSON.parse(
        process.env.PIMLICO_SPONSORED_POLICY_MAINNET || '[]'
      ),
      testnetPolicies: JSON.parse(
        process.env.PIMLICO_SPONSORED_POLICY_SEPOLIA || '[]'
      )
    });
  });

  beforeEach(async () => {
    // Setup test accounts and clients
    account = privateKeyToAccount(TEST_OWNER_KEY);
    sessionKey = privateKeyToAccount(TEST_SESSION_KEY);

    client = createPublicClient({
      chain,
      transport: http(rpc)
    }) as PublicClient<Transport, Chain>;

    walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpc)
    });
  });

  describe('createSafeWallets', () => {
    it('should create a safe wallet on multiple chains', async () => {
      const wallets = await generateWallet(
        wagmiConfig,
        [account.address],
        TEST_SALT,
        [chain.id]
      );

      expect(wallets).toHaveLength(2);

      wallets.forEach((wallet) => {
        expect(wallet).toMatchObject({
          address: expect.any(String),
          network: expect.any(Number),
          deployed: expect.any(Boolean),
          version: expect.stringContaining('_')
        });
      });
    });

    it('should throw error with invalid client', async () => {
      await expect(
        generateWallet(
          wagmiConfig,
          [account.address],
          TEST_SALT,
          [{ id: 999999 } as any] // Invalid chain
        )
      ).rejects.toThrow('Empty client');
    });
  });

  describe('signTx', () => {
    beforeEach(async () => {
      // Create a safe wallet for testing
      const wallets = await generateWallet(
        wagmiConfig,
        [account.address],
        TEST_SALT,
        [chain.id]
      );
      safeAddress = wallets[0].address;

      const timeFramePolicy = getTimeFramePolicy({
        validAfter: 0, // always valid start
        validUntil: Date.now() + 60 * 60 * 24 * 90 // valid for 90 days
      });

      const valuePolicy = getValueLimitPolicy({
        limit: parseEther('0.0005')
      });

      const spendLimitPolicy = getSpendingLimitsPolicy([
        {
          token: USDC_TOKEN_ADDRESS,
          limit: parseUnits('10', 6)
        }
      ]);

      session = {
        sessionValidator: OWNABLE_VALIDATOR_ADDRESS,
        permitERC4337Paymaster: true,
        sessionValidatorInitData: encodeValidationData({
          threshold: 1,
          owners: [sessionKey.address]
        }),
        salt: toHex(toBytes('7', { size: 32 })),
        userOpPolicies: [getSudoPolicy()],
        erc7739Policies: {
          allowedERC7739Content: [],
          erc1271Policies: []
        },
        actions: [
          {
            actionTarget: '0x0000000000000000000000000000000000000001',
            actionTargetSelector: '0x00000001',
            actionPolicies: [spendLimitPolicy]
          }
        ],
        chainId: BigInt(chain.id)
      };

      sessionId = getPermissionId({ session });

      console.log(`
      Safe account: ${safeAddress}
      Safe owner: ${account.address}
      Session key: ${sessionKey.address}
      Session ID: ${sessionId}
      Session: ${session}`);
    });

    it('should send a transaction', async () => {
      const statusCallback = vi.fn();

      const calls = [
        {
          to: TEST_RECIPIENT,
          value: parseEther('0'),
          data: '0x' as Hex
        }
      ];

      const txHash = await sendTransaction(
        client,
        account,
        calls,
        safeAddress,
        [account.address],
        TEST_SALT,
        {
          sponsoredTx: true,
          onStatus: statusCallback
        }
      );

      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(statusCallback).toHaveBeenCalledWith('preparing');
      expect(statusCallback).toHaveBeenCalledWith('signing');
      expect(statusCallback).toHaveBeenCalledWith('submitted');
    });

    it('should revert transaction', async () => {
      const statusCallback = vi.fn();

      const calls: UserOperationCall[] = [
        {
          to: TEST_RECIPIENT,
          value: parseEther('0.1'),
          data: '0x' as Hex
        }
      ];

      await expect(
        sendTransaction(
          client,
          account,
          calls,
          safeAddress,
          [account.address],
          TEST_SALT,
          { onStatus: statusCallback }
        )
      ).rejects.toThrow('reverted');

      expect(statusCallback).toHaveBeenCalledWith('reverted');
    });

    it.skip('should handle insufficient fees error', async () => {
      const statusCallback = vi.fn();

      const calls: UserOperationCall[] = [
        {
          to: TEST_RECIPIENT,
          value: parseEther('0.000000001'),
          data: '0x' as Hex
        }
      ];

      await expect(
        sendTransaction(
          client,
          account,
          calls,
          safeAddress,
          [account.address],
          TEST_SALT,
          { onStatus: statusCallback }
        )
      ).rejects.toThrow();

      expect(statusCallback).toHaveBeenCalledWith(
        expect.stringMatching(/^(preparing|signing|insufficient_fee)$/)
      );
    });

    it('should handle sponsorship failure', async () => {
      // Mock just for this test
      const originalPimlicoSponsorshipPolicyIds = vi.spyOn(
        await import('@payflow/common/src/paymaster/pimlico'),
        'sponsorshipPolicyIds'
      );
      originalPimlicoSponsorshipPolicyIds.mockImplementation(() => [
        'invalid_policy_id'
      ]);

      const statusCallback = vi.fn();

      const calls: UserOperationCall[] = [
        {
          to: TEST_RECIPIENT,
          value: parseEther('0.000000001'),
          data: '0x' as Hex
        }
      ];

      try {
        await expect(
          sendTransaction(
            client,
            account,
            calls,
            safeAddress,
            [account.address],
            TEST_SALT,
            {
              sponsoredTx: true,
              onStatus: statusCallback
            }
          )
        ).rejects.toThrow();

        expect(statusCallback).toHaveBeenCalledWith(
          expect.stringMatching(/^(preparing|signing|sponsorship_failed)$/)
        );
      } finally {
        // Clean up the mock after test
        originalPimlicoSponsorshipPolicyIds.mockRestore();
      }
    });

    it('should install module without session', async () => {
      const statusCallback = vi.fn();

      // Use the already setup test account and safeAddress from beforeEach
      const opHash = await manageSessions(
        client,
        account,
        safeAddress,
        [account.address],
        TEST_SALT,
        [],
        [],
        {
          sponsoredTx: false
        }
      );

      console.log('opHash', opHash);

      expect(opHash === null || /^0x[a-fA-F0-9]{64}$/.test(opHash)).toBe(true);
    });

    it('should install module with session', async () => {
      // Use the already setup test account and safeAddress from beforeEach
      const opHash = await manageSessions(
        client,
        account,
        safeAddress,
        [account.address],
        TEST_SALT,
        [session],
        [],
        {
          sponsoredTx: true
        }
      );

      console.log('opHash', opHash);

      // Fund the safe with some ETH first
      const fundingTx = await walletClient.sendTransaction({
        to: safeAddress,
        value: parseEther('0.0001')
      });

      console.log('fundingTx', fundingTx);

      // Wait for the funding transaction to be mined
      await client.waitForTransactionReceipt({
        hash: fundingTx
      });

      await expect(
        sendTransactionWithSession(
          client,
          safeAddress,
          {
            sessionId: getPermissionId({ session }),
            sessionKey
          },
          [
            {
              to: TEST_RECIPIENT,
              value: parseEther('0.001'),
              data: '0x' as Hex
            }
          ]
        )
      ).rejects.toThrow();

      const txHash = await sendTransactionWithSession(
        client,
        safeAddress,
        {
          sessionId,
          sessionKey
        },
        [
          {
            to: TEST_RECIPIENT,
            value: parseEther('0.000000001')
          }
        ]
      );

      console.log('txHash', txHash);

      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should send a transaction with session', async () => {
      const calls: UserOperationCall[] = [
        /*  {
            to: '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83',
            value: parseEther('0.000000001')
          } */
        {
          to: USDC_TOKEN_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [
              '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83',
              parseUnits('0.5', 6)
            ]
          })
        }
      ];

      console.log('calls:', calls);

      return;

      const txHash = await sendTransactionWithSession(
        client,
        safeAddress,
        {
          sessionId,
          sessionKey
        },
        calls
      );

      console.log('txHash', txHash);

      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    // let's add one more session to existing smart account
    it('should enable session', async () => {
      const opHash = await manageSessions(
        client,
        account,
        safeAddress,
        [account.address],
        TEST_SALT,
        [session],
        [],
        {
          sponsoredTx: false
        }
      );

      console.log('opHash', opHash);
    });

    it('should send a transaction from account', async () => {
      const txHash = await walletClient.sendTransaction({
        /*  to: safeAddress,
        value: parseEther('0.00001') */

        to: USDC_TOKEN_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [safeAddress, parseUnits('3', 6)]
        })
      });

      console.log('txHash', txHash);

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash
      });

      console.log('receipt', receipt);
    });

    it('should mint with session', async () => {
      const txHash = await sendTransactionWithSession(
        client,
        safeAddress,
        {
          sessionId,
          sessionKey
        },
        [
          {
            to: '0x440da465de22e2b558634a0fc37fac61c9b95719',
            data: encodeFunctionData({
              abi: zoraAdminMintAbi,
              functionName: 'adminMint',
              args: [TEST_RECIPIENT, 1, 1, '0x']
            })
          }
        ]
      );

      console.log('txHash', txHash);

      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should remove session', async () => {
      const txHash = await manageSessions(
        client,
        account,
        safeAddress,
        [account.address],
        TEST_SALT,
        // add session to enable
        [session],
        // remove session
        [sessionId],
        {
          sponsoredTx: true
        }
      );

      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });
});
