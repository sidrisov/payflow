export const buyFanTokenAbi = [
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
  { inputs: [], name: 'MoxieBondingCurve_InvalidAmount', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidBeneficiary', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidDepositAmount', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidFeePercentage', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidFormula', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidOwner', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidReserveRation', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidSellAmount', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidSubject', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidSubjectFactory', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidSubjectSupply', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidSubjectToken', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidToken', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidTokenManager', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_InvalidVault', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_OnlySubjectFactory', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_SlippageExceedsLimit', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_SubjectAlreadyInitialized', type: 'error' },
  { inputs: [], name: 'MoxieBondingCurve_SubjectNotInitialized', type: 'error' },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_subject', type: 'address' },
      { indexed: true, internalType: 'address', name: '_subjectToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_initialSupply', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_reserve', type: 'uint256' },
      { indexed: false, internalType: 'uint32', name: '_reserveRatio', type: 'uint32' }
    ],
    name: 'BondingCurveInitialized',
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
    inputs: [
      { indexed: true, internalType: 'address', name: '_subject', type: 'address' },
      { indexed: true, internalType: 'address', name: '_sellToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_sellAmount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: '_spender', type: 'address' },
      { indexed: false, internalType: 'address', name: '_buyToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_buyAmount', type: 'uint256' },
      { indexed: true, internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'SubjectSharePurchased',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_subject', type: 'address' },
      { indexed: true, internalType: 'address', name: '_sellToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_sellAmount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: '_spender', type: 'address' },
      { indexed: false, internalType: 'address', name: '_buyToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_buyAmount', type: 'uint256' },
      { indexed: true, internalType: 'address', name: '_beneficiary', type: 'address' }
    ],
    name: 'SubjectShareSold',
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
    inputs: [{ indexed: false, internalType: 'address', name: '_beneficiary', type: 'address' }],
    name: 'UpdateBeneficiary',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: '_protocolBuyFeePct', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_protocolSellFeePct', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_subjectBuyFeePct', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_subjectSellFeePct', type: 'uint256' }
    ],
    name: 'UpdateFees',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: '_formula', type: 'address' }],
    name: 'UpdateFormula',
    type: 'event'
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
    inputs: [],
    name: 'PCT_BASE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'PPM',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'UPDATE_BENEFICIARY_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'UPDATE_FEES_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'UPDATE_FORMULA_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_depositAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_minReturnAmountAfterFee', type: 'uint256' }
    ],
    name: 'buyShares',
    outputs: [{ internalType: 'uint256', name: 'shares_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_depositAmount', type: 'uint256' },
      { internalType: 'address', name: '_onBehalfOf', type: 'address' },
      { internalType: 'uint256', name: '_minReturnAmountAfterFee', type: 'uint256' }
    ],
    name: 'buySharesFor',
    outputs: [{ internalType: 'uint256', name: 'shares_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_subjectTokenAmount', type: 'uint256' }
    ],
    name: 'calculateTokensForBuy',
    outputs: [
      { internalType: 'uint256', name: 'moxieAmount_', type: 'uint256' },
      { internalType: 'uint256', name: 'protocolFee_', type: 'uint256' },
      { internalType: 'uint256', name: 'subjectFee_', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_subjectTokenAmount', type: 'uint256' }
    ],
    name: 'calculateTokensForSell',
    outputs: [
      { internalType: 'uint256', name: 'moxieAmount_', type: 'uint256' },
      { internalType: 'uint256', name: 'protocolFee_', type: 'uint256' },
      { internalType: 'uint256', name: 'subjectFee_', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'feeBeneficiary',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'formula',
    outputs: [{ internalType: 'contract IBancorFormula', name: '', type: 'address' }],
    stateMutability: 'view',
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
      { internalType: 'address', name: '_token', type: 'address' },
      { internalType: 'address', name: '_formula', type: 'address' },
      { internalType: 'address', name: '_owner', type: 'address' },
      { internalType: 'address', name: '_tokenManager', type: 'address' },
      { internalType: 'address', name: '_vault', type: 'address' },
      {
        components: [
          { internalType: 'uint256', name: 'protocolBuyFeePct', type: 'uint256' },
          { internalType: 'uint256', name: 'protocolSellFeePct', type: 'uint256' },
          { internalType: 'uint256', name: 'subjectBuyFeePct', type: 'uint256' },
          { internalType: 'uint256', name: 'subjectSellFeePct', type: 'uint256' }
        ],
        internalType: 'struct IMoxieBondingCurve.FeeInput',
        name: '_feeInput',
        type: 'tuple'
      },
      { internalType: 'address', name: '_feeBeneficiary', type: 'address' },
      { internalType: 'address', name: '_subjectFactory', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint32', name: '_reserveRatio', type: 'uint32' },
      { internalType: 'uint256', name: '_initialSupply', type: 'uint256' },
      { internalType: 'uint256', name: '_reserveAmount', type: 'uint256' }
    ],
    name: 'initializeSubjectBondingCurve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
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
    inputs: [],
    name: 'protocolBuyFeePct',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'protocolSellFeePct',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
    inputs: [{ internalType: 'address', name: 'subject', type: 'address' }],
    name: 'reserveRatio',
    outputs: [{ internalType: 'uint32', name: '_reserveRatio', type: 'uint32' }],
    stateMutability: 'view',
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
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_sellAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_minReturnAmountAfterFee', type: 'uint256' }
    ],
    name: 'sellShares',
    outputs: [{ internalType: 'uint256', name: 'returnAmount_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_subject', type: 'address' },
      { internalType: 'uint256', name: '_sellAmount', type: 'uint256' },
      { internalType: 'address', name: '_onBehalfOf', type: 'address' },
      { internalType: 'uint256', name: '_minReturnAmountAfterFee', type: 'uint256' }
    ],
    name: 'sellSharesFor',
    outputs: [{ internalType: 'uint256', name: 'returnAmount_', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'subjectBuyFeePct',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'subjectFactory',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'subjectSellFeePct',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
    name: 'token',
    outputs: [{ internalType: 'contract IERC20Extended', name: '', type: 'address' }],
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
    inputs: [{ internalType: 'address', name: '_feeBeneficiary', type: 'address' }],
    name: 'updateFeeBeneficiary',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'protocolBuyFeePct', type: 'uint256' },
          { internalType: 'uint256', name: 'protocolSellFeePct', type: 'uint256' },
          { internalType: 'uint256', name: 'subjectBuyFeePct', type: 'uint256' },
          { internalType: 'uint256', name: 'subjectSellFeePct', type: 'uint256' }
        ],
        internalType: 'struct IMoxieBondingCurve.FeeInput',
        name: '_feeInput',
        type: 'tuple'
      }
    ],
    name: 'updateFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_formula', type: 'address' }],
    name: 'updateFormula',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'vault',
    outputs: [{ internalType: 'contract IVault', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];
