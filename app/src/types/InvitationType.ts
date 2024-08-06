import { Address } from 'viem';
import { ProfileType } from './ProfileType';

export interface InvitationType {
  invitedBy: ProfileType;
  invitee: ProfileType;
  code: string;
  identity: string;
  createdDate: string;
  expiryDate: string;
}

export interface IdentityInvitedStatusType {
  [address: Address]: boolean;
}
