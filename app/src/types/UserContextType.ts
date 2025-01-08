import { ProfileType } from '@payflow/common';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType | undefined;
  isMiniApp: boolean;
  isFrameV2: boolean;
}
