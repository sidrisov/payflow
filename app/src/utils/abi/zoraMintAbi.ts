export const zoraMintAbi = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    inputs: [{ internalType: 'address', name: 'target', type: 'address' }],
    name: 'AddressEmptyCode',
    type: 'error'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'AddressInsufficientBalance',
    type: 'error'
  },
  { inputs: [], name: 'AddressZero', type: 'error' },
  { inputs: [], name: 'ERC1167FailedCreateClone', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
    type: 'error'
  },
  { inputs: [], name: 'ERC1967NonPayable', type: 'error' },
  { inputs: [], name: 'EndTimeCannotBeInThePast', type: 'error' },
  { inputs: [], name: 'FailedInnerCall', type: 'error' },
  { inputs: [], name: 'InsufficientFunds', type: 'error' },
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  { inputs: [], name: 'MarketAlreadyLaunched', type: 'error' },
  { inputs: [], name: 'MarketMinimumNotReached', type: 'error' },
  { inputs: [], name: 'MinimumMarketEthNotMet', type: 'error' },
  { inputs: [], name: 'NeedsToBeAtLeastOneSaleToStartMarket', type: 'error' },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  { inputs: [], name: 'OnlyZoraRewardRecipient', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnableInvalidOwner',
    type: 'error'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error'
  },
  { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
  { inputs: [], name: 'RequestMintInvalidUseMint', type: 'error' },
  { inputs: [], name: 'ResetSaleNotAvailable', type: 'error' },
  { inputs: [], name: 'SaleAlreadySet', type: 'error' },
  { inputs: [], name: 'SaleEnded', type: 'error' },
  { inputs: [], name: 'SaleHasNotStarted', type: 'error' },
  { inputs: [], name: 'SaleInProgress', type: 'error' },
  { inputs: [], name: 'SaleNotSet', type: 'error' },
  { inputs: [], name: 'SaleV2AlreadyStarted', type: 'error' },
  { inputs: [], name: 'SaleV2Ended', type: 'error' },
  { inputs: [], name: 'SaleV2NotSet', type: 'error' },
  { inputs: [], name: 'StartTimeCannotBeAfterEndTime', type: 'error' },
  { inputs: [], name: 'UUPSUnauthorizedCallContext', type: 'error' },
  {
    inputs: [{ internalType: 'bytes32', name: 'slot', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
    type: 'error'
  },
  { inputs: [], name: 'WrongValueSent', type: 'error' },
  { inputs: [], name: 'ZoraCreator1155ContractNeedsToSupportReduceSupply', type: 'error' },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint64', name: 'version', type: 'uint64' }],
    name: 'Initialized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'collection', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'erc20zAddress', type: 'address' },
      { indexed: false, internalType: 'address', name: 'poolAddress', type: 'address' }
    ],
    name: 'MarketLaunched',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
      { indexed: true, internalType: 'address', name: 'collection', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'quantity', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'comment', type: 'string' }
    ],
    name: 'MintComment',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }
    ],
    name: 'OwnershipTransferStarted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'collection', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      {
        components: [
          { internalType: 'uint64', name: 'saleStart', type: 'uint64' },
          { internalType: 'uint64', name: 'saleEnd', type: 'uint64' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' }
        ],
        indexed: false,
        internalType: 'struct IZoraTimedSaleStrategy.SalesConfig',
        name: 'salesConfig',
        type: 'tuple'
      },
      { indexed: false, internalType: 'address', name: 'erc20zAddress', type: 'address' },
      { indexed: false, internalType: 'address', name: 'poolAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'mintFee', type: 'uint256' }
    ],
    name: 'SaleSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'collection', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      {
        components: [
          { internalType: 'uint64', name: 'saleStart', type: 'uint64' },
          { internalType: 'uint64', name: 'marketCountdown', type: 'uint64' },
          { internalType: 'uint64', name: 'saleEnd', type: 'uint64' },
          { internalType: 'bool', name: 'secondaryActivated', type: 'bool' },
          { internalType: 'uint256', name: 'minimumMarketEth', type: 'uint256' },
          { internalType: 'address', name: 'poolAddress', type: 'address' },
          { internalType: 'address payable', name: 'erc20zAddress', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' }
        ],
        indexed: false,
        internalType: 'struct IZoraTimedSaleStrategy.SaleData',
        name: 'saleData',
        type: 'tuple'
      },
      { indexed: false, internalType: 'uint256', name: 'mintFee', type: 'uint256' }
    ],
    name: 'SaleSetV2',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'Upgraded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'prevRecipient', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newRecipient', type: 'address' }
    ],
    name: 'ZoraRewardRecipientUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'collection', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'creatorReward', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'createReferral', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'createReferralReward', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'mintReferral', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'mintReferralReward', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'market', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'marketReward', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'zoraRecipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'zoraReward', type: 'uint256' }
    ],
    name: 'ZoraTimedSaleStrategyRewards',
    type: 'event'
  },
  {
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'collection', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'erc20zAddress', type: 'address' }
    ],
    name: 'calculateERC20zActivate',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'finalTotalERC20ZSupply', type: 'uint256' },
          { internalType: 'uint256', name: 'erc20Reserve', type: 'uint256' },
          { internalType: 'uint256', name: 'erc20Liquidity', type: 'uint256' },
          { internalType: 'uint256', name: 'excessERC20', type: 'uint256' },
          { internalType: 'uint256', name: 'excessERC1155', type: 'uint256' },
          { internalType: 'uint256', name: 'additionalERC1155ToMint', type: 'uint256' },
          { internalType: 'uint256', name: 'final1155Supply', type: 'uint256' }
        ],
        internalType: 'struct IZoraTimedSaleStrategy.ERC20zActivate',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'quantity', type: 'uint256' }],
    name: 'computeRewards',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'totalReward', type: 'uint256' },
          { internalType: 'uint256', name: 'creatorReward', type: 'uint256' },
          { internalType: 'uint256', name: 'createReferralReward', type: 'uint256' },
          { internalType: 'uint256', name: 'mintReferralReward', type: 'uint256' },
          { internalType: 'uint256', name: 'marketReward', type: 'uint256' },
          { internalType: 'uint256', name: 'zoraReward', type: 'uint256' }
        ],
        internalType: 'struct IZoraTimedSaleStrategy.RewardsSettings',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [],
    name: 'contractName',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [],
    name: 'contractURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [],
    name: 'contractVersion',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [],
    name: 'erc20zImpl',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'collection', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'getCreateReferral',
    outputs: [{ internalType: 'address', name: 'createReferral', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_defaultOwner', type: 'address' },
      { internalType: 'address', name: '_zoraRewardRecipient', type: 'address' },
      { internalType: 'address', name: '_erc20zImpl', type: 'address' },
      { internalType: 'contract IProtocolRewards', name: '_protocolRewards', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'collection', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'launchMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'mintTo', type: 'address' },
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
      { internalType: 'address', name: 'collection', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'mintReferral', type: 'address' },
      { internalType: 'string', name: 'comment', type: 'string' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'protocolRewards',
    outputs: [{ internalType: 'contract IProtocolRewards', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'bytes', name: '', type: 'bytes' }
    ],
    name: 'requestMint',
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'enum ICreatorCommands.CreatorActions',
                name: 'method',
                type: 'uint8'
              },
              { internalType: 'bytes', name: 'args', type: 'bytes' }
            ],
            internalType: 'struct ICreatorCommands.Command[]',
            name: 'commands',
            type: 'tuple[]'
          },
          { internalType: 'uint256', name: 'at', type: 'uint256' }
        ],
        internalType: 'struct ICreatorCommands.CommandSet',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'collection', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'sale',
    outputs: [
      {
        components: [
          { internalType: 'address payable', name: 'erc20zAddress', type: 'address' },
          { internalType: 'uint64', name: 'saleStart', type: 'uint64' },
          { internalType: 'address', name: 'poolAddress', type: 'address' },
          { internalType: 'uint64', name: 'saleEnd', type: 'uint64' },
          { internalType: 'bool', name: 'secondaryActivated', type: 'bool' }
        ],
        internalType: 'struct IZoraTimedSaleStrategy.SaleStorage',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'collection', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'saleV2',
    outputs: [
      {
        components: [
          { internalType: 'uint64', name: 'saleStart', type: 'uint64' },
          { internalType: 'uint64', name: 'marketCountdown', type: 'uint64' },
          { internalType: 'uint64', name: 'saleEnd', type: 'uint64' },
          { internalType: 'bool', name: 'secondaryActivated', type: 'bool' },
          { internalType: 'uint256', name: 'minimumMarketEth', type: 'uint256' },
          { internalType: 'address', name: 'poolAddress', type: 'address' },
          { internalType: 'address payable', name: 'erc20zAddress', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' }
        ],
        internalType: 'struct IZoraTimedSaleStrategy.SaleData',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      {
        components: [
          { internalType: 'uint64', name: 'saleStart', type: 'uint64' },
          { internalType: 'uint64', name: 'saleEnd', type: 'uint64' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' }
        ],
        internalType: 'struct IZoraTimedSaleStrategy.SalesConfig',
        name: 'salesConfig',
        type: 'tuple'
      }
    ],
    name: 'setSale',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      {
        components: [
          { internalType: 'uint64', name: 'saleStart', type: 'uint64' },
          { internalType: 'uint64', name: 'marketCountdown', type: 'uint64' },
          { internalType: 'uint256', name: 'minimumMarketEth', type: 'uint256' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' }
        ],
        internalType: 'struct IZoraTimedSaleStrategy.SalesConfigV2',
        name: 'salesConfig',
        type: 'tuple'
      }
    ],
    name: 'setSaleV2',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'setZoraRewardRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'int256', name: 'amount0Delta', type: 'int256' },
      { internalType: 'int256', name: 'amount1Delta', type: 'int256' },
      { internalType: 'bytes', name: '', type: 'bytes' }
    ],
    name: 'uniswapV3SwapCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint64', name: 'newStartTime', type: 'uint64' },
      { internalType: 'uint64', name: 'newMarketCountdown', type: 'uint64' }
    ],
    name: 'updateSale',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' }
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
];
