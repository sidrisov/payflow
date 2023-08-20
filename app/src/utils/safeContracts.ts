import { ContractNetworksConfig } from '@safe-global/protocol-kit';
import { zoraTestnet, modeTestnet } from 'wagmi/chains';

export const CUSTOM_CONTRACTS_CHAINS: number[] = [zoraTestnet.id, modeTestnet.id];

export const CUSTOM_CONTRACTS: ContractNetworksConfig = {
  [zoraTestnet.id]: {
    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'
  },
  [modeTestnet.id]: {
    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'
  }
};
