import { ProfileType } from '@payflow/common';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType | undefined;
  isFrameV2: boolean;
}
