export const hypersubAbi = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { inputs: [], name: 'AllocationWithoutShares', type: 'error' },
  { inputs: [], name: 'DeactivationFailure', type: 'error' },
  { inputs: [], name: 'GateCheckFailure', type: 'error' },
  { inputs: [], name: 'GateInvalid', type: 'error' },
  { inputs: [], name: 'GlobalSupplyLimitExceeded', type: 'error' },
  { inputs: [], name: 'InsufficientBalance', type: 'error' },
  { inputs: [], name: 'InvalidAccount', type: 'error' },
  { inputs: [], name: 'InvalidBasisPoints', type: 'error' },
  { inputs: [], name: 'InvalidCapture', type: 'error' },
  { inputs: [], name: 'InvalidCurve', type: 'error' },
  { inputs: [], name: 'InvalidFeeParams', type: 'error' },
  { inputs: [], name: 'InvalidHolder', type: 'error' },
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  { inputs: [], name: 'InvalidOwner', type: 'error' },
  { inputs: [], name: 'InvalidTokenParams', type: 'error' },
  { inputs: [], name: 'MaxCommitmentExceeded', type: 'error' },
  { inputs: [], name: 'NoRewardsToClaim', type: 'error' },
  { inputs: [], name: 'NoSharesToBurn', type: 'error' },
  { inputs: [], name: 'NotAuthorized', type: 'error' },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  { inputs: [], name: 'NotSlashable', type: 'error' },
  { inputs: [], name: 'Reentrancy', type: 'error' },
  { inputs: [], name: 'ReferralLocked', type: 'error' },
  { inputs: [], name: 'SubscriptionNotFound', type: 'error' },
  { inputs: [], name: 'TierEndExceeded', type: 'error' },
  {
    inputs: [{ internalType: 'uint16', name: 'tierId', type: 'uint16' }],
    name: 'TierHasNoSupply',
    type: 'error'
  },
  { inputs: [], name: 'TierInvalidDuration', type: 'error' },
  {
    inputs: [{ internalType: 'uint256', name: 'mintPrice', type: 'uint256' }],
    name: 'TierInvalidMintPrice',
    type: 'error'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'renewalPrice', type: 'uint256' }],
    name: 'TierInvalidRenewalPrice',
    type: 'error'
  },
  { inputs: [], name: 'TierInvalidSupplyCap', type: 'error' },
  { inputs: [], name: 'TierInvalidSwitch', type: 'error' },
  {
    inputs: [{ internalType: 'uint16', name: 'tierId', type: 'uint16' }],
    name: 'TierNotFound',
    type: 'error'
  },
  { inputs: [], name: 'TierNotStarted', type: 'error' },
  { inputs: [], name: 'TierRenewalsPaused', type: 'error' },
  { inputs: [], name: 'TierTimingInvalid', type: 'error' },
  { inputs: [], name: 'TierTransferDisabled', type: 'error' },
  { inputs: [], name: 'TokenAlreadyExists', type: 'error' },
  { inputs: [], name: 'TokenDoesNotExist', type: 'error' },
  { inputs: [], name: 'TokenNotAuthorized', type: 'error' },
  { inputs: [], name: 'TransferToExistingSubscriber', type: 'error' },
  { inputs: [], name: 'TransferToZeroAddress', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' }
    ],
    name: 'ApprovalForAll',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: '_fromTokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_toTokenId', type: 'uint256' }
    ],
    name: 'BatchMetadataUpdate',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'account', type: 'address' }],
    name: 'ClientFeeRecipientChange',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint8', name: 'curveId', type: 'uint8' }],
    name: 'CurveCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'tokensTransferred', type: 'uint256' }
    ],
    name: 'FeeTransfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'supplyCap', type: 'uint256' }],
    name: 'GlobalSupplyCapChange',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint64', name: 'tokenId', type: 'uint64' },
      { indexed: false, internalType: 'uint48', name: 'secondsGranted', type: 'uint48' },
      { indexed: false, internalType: 'uint48', name: 'expiresAt', type: 'uint48' }
    ],
    name: 'Grant',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint64', name: 'tokenId', type: 'uint64' },
      { indexed: false, internalType: 'uint48', name: 'time', type: 'uint48' },
      { indexed: false, internalType: 'uint48', name: 'expiresAt', type: 'uint48' }
    ],
    name: 'GrantRevoke',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint64', name: 'version', type: 'uint64' }],
    name: 'Initialized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'MetadataUpdate',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnerChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'proposed', type: 'address' }],
    name: 'OwnerProposed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'account', type: 'address' }],
    name: 'ProtocolFeeRecipientChange',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint64', name: 'tokenId', type: 'uint64' },
      { indexed: false, internalType: 'uint256', name: 'tokensTransferred', type: 'uint256' },
      { indexed: false, internalType: 'uint48', name: 'timePurchased', type: 'uint48' },
      { indexed: false, internalType: 'uint48', name: 'expiresAt', type: 'uint48' }
    ],
    name: 'Purchase',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'uint256', name: 'code', type: 'uint256' }],
    name: 'ReferralDestroyed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'referrer', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'referralId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'rewardAmount', type: 'uint256' }
    ],
    name: 'ReferralPayout',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'uint256', name: 'code', type: 'uint256' }],
    name: 'ReferralSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint64', name: 'tokenId', type: 'uint64' },
      { indexed: false, internalType: 'uint256', name: 'tokensTransferred', type: 'uint256' },
      { indexed: false, internalType: 'uint48', name: 'timeReclaimed', type: 'uint48' }
    ],
    name: 'Refund',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'RewardsAllocated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'RewardsClaimed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint16', name: 'role', type: 'uint16' }
    ],
    name: 'RoleChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'numShares', type: 'uint256' }
    ],
    name: 'SharesBurned',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'numShares', type: 'uint256' }
    ],
    name: 'SharesIssued',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'SlashTransferFallback',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint64', name: 'tokenId', type: 'uint64' },
      { indexed: false, internalType: 'uint16', name: 'oldTier', type: 'uint16' },
      { indexed: false, internalType: 'uint16', name: 'newTier', type: 'uint16' }
    ],
    name: 'SwitchTier',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint16', name: 'tierId', type: 'uint16' }],
    name: 'TierCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint16', name: 'tierId', type: 'uint16' }],
    name: 'TierUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'tokensIn', type: 'uint256' }],
    name: 'TopUp',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'TransferRecipientChange',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'tokensTransferred', type: 'uint256' }
    ],
    name: 'Withdraw',
    type: 'event'
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
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: 'numSeconds', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'contractDetail',
    outputs: [
      {
        components: [
          { internalType: 'uint16', name: 'tierCount', type: 'uint16' },
          { internalType: 'uint64', name: 'subCount', type: 'uint64' },
          { internalType: 'uint64', name: 'supplyCap', type: 'uint64' },
          { internalType: 'address', name: 'transferRecipient', type: 'address' },
          { internalType: 'address', name: 'currency', type: 'address' },
          { internalType: 'uint256', name: 'creatorBalance', type: 'uint256' },
          { internalType: 'uint8', name: 'numCurves', type: 'uint8' },
          { internalType: 'uint256', name: 'rewardShares', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardBalance', type: 'uint256' },
          { internalType: 'uint32', name: 'rewardSlashGracePeriod', type: 'uint32' },
          { internalType: 'bool', name: 'rewardSlashable', type: 'bool' }
        ],
        internalType: 'struct ContractView',
        name: 'detail',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'contractURI',
    outputs: [{ internalType: 'string', name: 'uri', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint8', name: 'numPeriods', type: 'uint8' },
          { internalType: 'uint8', name: 'formulaBase', type: 'uint8' },
          { internalType: 'uint48', name: 'periodSeconds', type: 'uint48' },
          { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
          { internalType: 'uint8', name: 'minMultiplier', type: 'uint8' }
        ],
        internalType: 'struct CurveParams',
        name: 'curve',
        type: 'tuple'
      }
    ],
    name: 'createRewardCurve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint32', name: 'periodDurationSeconds', type: 'uint32' },
          { internalType: 'uint32', name: 'maxSupply', type: 'uint32' },
          { internalType: 'uint48', name: 'maxCommitmentSeconds', type: 'uint48' },
          { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
          { internalType: 'uint48', name: 'endTimestamp', type: 'uint48' },
          { internalType: 'uint8', name: 'rewardCurveId', type: 'uint8' },
          { internalType: 'uint16', name: 'rewardBasisPoints', type: 'uint16' },
          { internalType: 'bool', name: 'paused', type: 'bool' },
          { internalType: 'bool', name: 'transferrable', type: 'bool' },
          { internalType: 'uint256', name: 'initialMintPrice', type: 'uint256' },
          { internalType: 'uint256', name: 'pricePerPeriod', type: 'uint256' },
          {
            components: [
              { internalType: 'enum GateType', name: 'gateType', type: 'uint8' },
              { internalType: 'address', name: 'contractAddress', type: 'address' },
              { internalType: 'uint256', name: 'componentId', type: 'uint256' },
              { internalType: 'uint256', name: 'balanceMin', type: 'uint256' }
            ],
            internalType: 'struct Gate',
            name: 'gate',
            type: 'tuple'
          }
        ],
        internalType: 'struct Tier',
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'createTier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint8', name: 'curveId', type: 'uint8' }],
    name: 'curveDetail',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'numPeriods', type: 'uint8' },
          { internalType: 'uint8', name: 'formulaBase', type: 'uint8' },
          { internalType: 'uint48', name: 'periodSeconds', type: 'uint48' },
          { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
          { internalType: 'uint8', name: 'minMultiplier', type: 'uint8' }
        ],
        internalType: 'struct CurveParams',
        name: 'curve',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'deactivateSubscription',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'feeDetail',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'protocolRecipient', type: 'address' },
          { internalType: 'uint16', name: 'protocolBps', type: 'uint16' },
          { internalType: 'uint16', name: 'clientBps', type: 'uint16' },
          { internalType: 'uint16', name: 'clientReferralBps', type: 'uint16' },
          { internalType: 'address', name: 'clientRecipient', type: 'address' }
        ],
        internalType: 'struct FeeParams',
        name: 'fee',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint48', name: 'numSeconds', type: 'uint48' },
      { internalType: 'uint16', name: 'tierId', type: 'uint16' }
    ],
    name: 'grantTime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'string', name: 'contractUri', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'address', name: 'currencyAddress', type: 'address' },
          { internalType: 'uint64', name: 'globalSupplyCap', type: 'uint64' }
        ],
        internalType: 'struct InitParams',
        name: 'params',
        type: 'tuple'
      },
      {
        components: [
          { internalType: 'uint32', name: 'periodDurationSeconds', type: 'uint32' },
          { internalType: 'uint32', name: 'maxSupply', type: 'uint32' },
          { internalType: 'uint48', name: 'maxCommitmentSeconds', type: 'uint48' },
          { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
          { internalType: 'uint48', name: 'endTimestamp', type: 'uint48' },
          { internalType: 'uint8', name: 'rewardCurveId', type: 'uint8' },
          { internalType: 'uint16', name: 'rewardBasisPoints', type: 'uint16' },
          { internalType: 'bool', name: 'paused', type: 'bool' },
          { internalType: 'bool', name: 'transferrable', type: 'bool' },
          { internalType: 'uint256', name: 'initialMintPrice', type: 'uint256' },
          { internalType: 'uint256', name: 'pricePerPeriod', type: 'uint256' },
          {
            components: [
              { internalType: 'enum GateType', name: 'gateType', type: 'uint8' },
              { internalType: 'address', name: 'contractAddress', type: 'address' },
              { internalType: 'uint256', name: 'componentId', type: 'uint256' },
              { internalType: 'uint256', name: 'balanceMin', type: 'uint256' }
            ],
            internalType: 'struct Gate',
            name: 'gate',
            type: 'tuple'
          }
        ],
        internalType: 'struct Tier',
        name: 'tier',
        type: 'tuple'
      },
      {
        components: [
          { internalType: 'uint32', name: 'slashGracePeriod', type: 'uint32' },
          { internalType: 'bool', name: 'slashable', type: 'bool' }
        ],
        internalType: 'struct RewardParams',
        name: 'rewards',
        type: 'tuple'
      },
      {
        components: [
          { internalType: 'uint8', name: 'numPeriods', type: 'uint8' },
          { internalType: 'uint8', name: 'formulaBase', type: 'uint8' },
          { internalType: 'uint48', name: 'periodSeconds', type: 'uint48' },
          { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
          { internalType: 'uint8', name: 'minMultiplier', type: 'uint8' }
        ],
        internalType: 'struct CurveParams',
        name: 'curve',
        type: 'tuple'
      },
      {
        components: [
          { internalType: 'address', name: 'protocolRecipient', type: 'address' },
          { internalType: 'uint16', name: 'protocolBps', type: 'uint16' },
          { internalType: 'uint16', name: 'clientBps', type: 'uint16' },
          { internalType: 'uint16', name: 'clientReferralBps', type: 'uint16' },
          { internalType: 'address', name: 'clientRecipient', type: 'address' }
        ],
        internalType: 'struct FeeParams',
        name: 'fees',
        type: 'tuple'
      }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'numShares', type: 'uint256' }
    ],
    name: 'issueRewardShares',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'numTokens', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint16', name: 'tierId', type: 'uint16' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'address', name: 'referrer', type: 'address' },
          { internalType: 'uint256', name: 'referralCode', type: 'uint256' },
          { internalType: 'uint256', name: 'purchaseValue', type: 'uint256' }
        ],
        internalType: 'struct MintParams',
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'mintAdvanced',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'numTokens', type: 'uint256' }
    ],
    name: 'mintFor',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes[]', name: 'data', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ internalType: 'bytes[]', name: '', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
      { internalType: 'address', name: 'recipientAddress', type: 'address' },
      { internalType: 'uint256', name: 'tokenAmount', type: 'uint256' }
    ],
    name: 'recoverCurrency',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'code', type: 'uint256' }],
    name: 'referralDetail',
    outputs: [
      {
        components: [
          { internalType: 'uint16', name: 'basisPoints', type: 'uint16' },
          { internalType: 'bool', name: 'permanent', type: 'bool' },
          { internalType: 'address', name: 'referrer', type: 'address' }
        ],
        internalType: 'struct ReferralLib.Code',
        name: 'value',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'numTokens', type: 'uint256' }
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'revokeTime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ internalType: 'uint16', name: 'roles', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint64', name: 'supplyCap', type: 'uint64' }],
    name: 'setGlobalSupplyCap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'setPendingOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'code', type: 'uint256' },
      { internalType: 'uint16', name: 'basisPoints', type: 'uint16' },
      { internalType: 'bool', name: 'permanent', type: 'bool' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'setReferralCode',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint16', name: 'roles', type: 'uint16' }
    ],
    name: 'setRoles',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'setTransferRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'slash',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'stpVersion',
    outputs: [{ internalType: 'uint8', name: 'version', type: 'uint8' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'subscriptionOf',
    outputs: [
      {
        components: [
          { internalType: 'uint16', name: 'tierId', type: 'uint16' },
          { internalType: 'uint64', name: 'tokenId', type: 'uint64' },
          { internalType: 'uint48', name: 'expiresAt', type: 'uint48' },
          { internalType: 'uint48', name: 'purchaseExpiresAt', type: 'uint48' },
          { internalType: 'uint256', name: 'rewardShares', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardBalance', type: 'uint256' }
        ],
        internalType: 'struct SubscriberView',
        name: 'subscription',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint16', name: 'tierId', type: 'uint16' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'tierBalanceOf',
    outputs: [{ internalType: 'uint256', name: 'numSeconds', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint16', name: 'tierId', type: 'uint16' }],
    name: 'tierDetail',
    outputs: [
      {
        components: [
          { internalType: 'uint32', name: 'subCount', type: 'uint32' },
          { internalType: 'uint16', name: 'id', type: 'uint16' },
          {
            components: [
              { internalType: 'uint32', name: 'periodDurationSeconds', type: 'uint32' },
              { internalType: 'uint32', name: 'maxSupply', type: 'uint32' },
              { internalType: 'uint48', name: 'maxCommitmentSeconds', type: 'uint48' },
              { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
              { internalType: 'uint48', name: 'endTimestamp', type: 'uint48' },
              { internalType: 'uint8', name: 'rewardCurveId', type: 'uint8' },
              { internalType: 'uint16', name: 'rewardBasisPoints', type: 'uint16' },
              { internalType: 'bool', name: 'paused', type: 'bool' },
              { internalType: 'bool', name: 'transferrable', type: 'bool' },
              { internalType: 'uint256', name: 'initialMintPrice', type: 'uint256' },
              { internalType: 'uint256', name: 'pricePerPeriod', type: 'uint256' },
              {
                components: [
                  { internalType: 'enum GateType', name: 'gateType', type: 'uint8' },
                  { internalType: 'address', name: 'contractAddress', type: 'address' },
                  { internalType: 'uint256', name: 'componentId', type: 'uint256' },
                  { internalType: 'uint256', name: 'balanceMin', type: 'uint256' }
                ],
                internalType: 'struct Gate',
                name: 'gate',
                type: 'tuple'
              }
            ],
            internalType: 'struct Tier',
            name: 'params',
            type: 'tuple'
          }
        ],
        internalType: 'struct TierLib.State',
        name: 'tier',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: 'uri', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'numTokens', type: 'uint256' }],
    name: 'topUp',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'transferFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'transferRewardsFor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'updateClientFeeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'string', name: 'uri', type: 'string' }],
    name: 'updateMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'updateProtocolFeeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint16', name: 'tierId', type: 'uint16' },
      {
        components: [
          { internalType: 'uint32', name: 'periodDurationSeconds', type: 'uint32' },
          { internalType: 'uint32', name: 'maxSupply', type: 'uint32' },
          { internalType: 'uint48', name: 'maxCommitmentSeconds', type: 'uint48' },
          { internalType: 'uint48', name: 'startTimestamp', type: 'uint48' },
          { internalType: 'uint48', name: 'endTimestamp', type: 'uint48' },
          { internalType: 'uint8', name: 'rewardCurveId', type: 'uint8' },
          { internalType: 'uint16', name: 'rewardBasisPoints', type: 'uint16' },
          { internalType: 'bool', name: 'paused', type: 'bool' },
          { internalType: 'bool', name: 'transferrable', type: 'bool' },
          { internalType: 'uint256', name: 'initialMintPrice', type: 'uint256' },
          { internalType: 'uint256', name: 'pricePerPeriod', type: 'uint256' },
          {
            components: [
              { internalType: 'enum GateType', name: 'gateType', type: 'uint8' },
              { internalType: 'address', name: 'contractAddress', type: 'address' },
              { internalType: 'uint256', name: 'componentId', type: 'uint256' },
              { internalType: 'uint256', name: 'balanceMin', type: 'uint256' }
            ],
            internalType: 'struct Gate',
            name: 'gate',
            type: 'tuple'
          }
        ],
        internalType: 'struct Tier',
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'updateTier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'yieldRewards',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  { stateMutability: 'payable', type: 'receive' }
];
