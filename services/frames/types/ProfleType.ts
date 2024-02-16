import { Address } from 'viem';

export interface ProfileType {
  identity: Address;
  signer?: Address;
  createdDate: string;
  displayName?: string;
  username?: string;
  profileImage?: string;
  identityInviteLimit: number;
}
