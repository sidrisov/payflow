import { ProfileType } from './ProfleType';

export interface InvitationType {
  invitedBy: ProfileType;
  invitee: ProfileType;
  code: string;
  identity: string;
  createdDate: string;
  expiryDate: string;
}
