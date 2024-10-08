export const buyAndLockFanTokenAbi = [
  { inputs: [], name: 'AccessControlBadConfirmation', type: 'error' },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bytes32', name: 'neededRole', type: 'bytes32' }
    ],
    name: 'AccessControlUnauthorizedAccount',
    type: 'error'
  },
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
  { inputs: [], name: 'EnforcedPause', type: 'error' },
  { inputs: [], name: 'ExpectedPause', type: 'error' },
  { inputs: [], name: 'FailedInnerCall', type: 'error' },
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error'
  },
  { inputs: [], name: 'Staking_AmountShouldBeGreaterThanZero', type: 'error' },
  { inputs: [], name: 'Staking_EmptyIndexes', type: 'error' },
  { inputs: [], name: 'Staking_InvalidBeneficiary', type: 'error' },
  { inputs: [], name: 'Staking_InvalidDefaultAdmin', type: 'error' },
  { inputs: [], name: 'Staking_InvalidInputLength', type: 'error' },
  { inputs: [], name: 'Staking_InvalidLockPeriod', type: 'error' },
  { inputs: [], name: 'Staking_InvalidMoxieBondingCurve', type: 'error' },
  { inputs: [], name: 'Staking_InvalidMoxieToken', type: 'error' },
  { inputs: [], name: 'Staking_InvalidSubject', type: 'error' },
  { inputs: [], name: 'Staking_InvalidSubjectToken', type: 'error' },
  { inputs: [], name: 'Staking_InvalidTokenManager', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'index', type: 'uint256' },
      { internalType: 'uint256', name: 'currentTime', type: 'uint256' },
      { internalType: 'uint256', name: 'unlockTime', type: 'uint256' }
    ],
    name: 'Staking_LockNotExpired',
    type: 'error'
  },
  { inputs: [], name: 'Staking_LockPeriodAlreadySet', type: 'error' },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'Staking_NotOwner',
    type: 'error'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'Staking_NotSameUser',
    type: 'error'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'Staking_SubjectsDoesNotMatch',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint64', name: 'version', type: 'uint64' }],
    name: 'Initialized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_user', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subject', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subjectToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_index', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_unlockTimeInSec', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { indexed: false, internalType: 'address', name: '_buyer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_moxieDepositAmount', type: 'uint256' }
    ],
    name: 'Lock',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_user', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subject', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subjectToken', type: 'address' },
      { indexed: false, internalType: 'uint256[]', name: '_indexes', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'LockExtended',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { indexed: true, internalType: 'bool', name: '_allowed', type: 'bool' }
    ],
    name: 'LockPeriodUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Paused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'previousAdminRole', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'newAdminRole', type: 'bytes32' }
    ],
    name: 'RoleAdminChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' }
    ],
    name: 'RoleGranted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' }
    ],
    name: 'RoleRevoked',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Unpaused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_user', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subject', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subjectToken', type: 'address' },
      { indexed: false, internalType: 'uint256[]', name: '_indexes', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'Withdraw',
    type: 'event'
  },
  {
    inputs: [],
    name: 'CHANGE_LOCK_DURATION',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'PAUSE_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_depositAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_minReturnAmountAfterFee', type: 'uint256' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' }
    ],
    name: 'buyAndLock',
    outputs: [
      { internalType: 'uint256', name: 'amount_', type: 'uint256' },
      { internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_depositAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_minReturnAmountAfterFee', type: 'uint256' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'buyAndLockFor',
    outputs: [
      { internalType: 'uint256', name: 'amount_', type: 'uint256' },
      { internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_subjects', type: 'address[]' },
      { internalType: 'uint256[]', name: '_depositAmounts', type: 'uint256[]' },
      { internalType: 'uint256[]', name: '_minReturnAmountsAfterFee', type: 'uint256[]' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' }
    ],
    name: 'buyAndLockMultiple',
    outputs: [
      { internalType: 'uint256[]', name: 'amounts_', type: 'uint256[]' },
      { internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_subjects', type: 'address[]' },
      { internalType: 'uint256[]', name: '_depositAmounts', type: 'uint256[]' },
      { internalType: 'uint256[]', name: '_minReturnAmountsAfterFee', type: 'uint256[]' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'buyAndLockMultipleFor',
    outputs: [
      { internalType: 'uint256[]', name: 'amounts_', type: 'uint256[]' },
      { internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' }
    ],
    name: 'depositAndLock',
    outputs: [{ internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'depositAndLockFor',
    outputs: [{ internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_subjects', type: 'address[]' },
      { internalType: 'uint256[]', name: '_amounts', type: 'uint256[]' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' }
    ],
    name: 'depositAndLockMultiple',
    outputs: [{ internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_subjects', type: 'address[]' },
      { internalType: 'uint256[]', name: '_amounts', type: 'uint256[]' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'depositAndLockMultipleFor',
    outputs: [{ internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256[]', name: '_indexes', type: 'uint256[]' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' }
    ],
    name: 'extendLock',
    outputs: [
      { internalType: 'uint256', name: 'totalAmount_', type: 'uint256' },
      { internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256[]', name: '_indexes', type: 'uint256[]' },
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'extendLockFor',
    outputs: [
      { internalType: 'uint256', name: 'totalAmount_', type: 'uint256' },
      { internalType: 'uint256', name: 'unlockTimeInSec_', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_user', type: 'address' },
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256[]', name: '_indexes', type: 'uint256[]' }
    ],
    name: 'getTotalStakedAmount',
    outputs: [{ internalType: 'uint256', name: 'totalAmount_', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_tokenManager', type: 'address' },
      { internalType: 'address', name: '_moxieBondingCurve', type: 'address' },
      { internalType: 'address', name: '_moxieToken', type: 'address' },
      { internalType: 'address', name: '_defaultAdmin', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'lockCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'lockPeriodInSec', type: 'uint256' }],
    name: 'lockPeriodsInSec',
    outputs: [{ internalType: 'bool', name: 'allowed', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'lockId', type: 'uint256' }],
    name: 'locks',
    outputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'address', name: 'subject', type: 'address' },
      { internalType: 'address', name: 'subjectToken', type: 'address' },
      { internalType: 'uint256', name: 'unlockTimeInSec', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'lockPeriodInSec', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'moxieBondingCurve',
    outputs: [{ internalType: 'contract IMoxieBondingCurve', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'moxieToken',
    outputs: [{ internalType: 'contract IERC20Extended', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'callerConfirmation', type: 'address' }
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_lockPeriodInSec', type: 'uint256' },
      { internalType: 'bool', name: '_allowed', type: 'bool' }
    ],
    name: 'setLockPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
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
    name: 'tokenManager',
    outputs: [{ internalType: 'contract ITokenManager', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256[]', name: '_indexes', type: 'uint256[]' }
    ],
    name: 'withdraw',
    outputs: [{ internalType: 'uint256', name: 'totalAmount_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];
