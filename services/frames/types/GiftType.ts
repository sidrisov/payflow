import { ProfileType } from './ProfleType';

export interface GiftProfileType {
  profile: ProfileType;
  gifts: GiftType[];
}

export interface GiftType {
  gifter: ProfileType;
}
