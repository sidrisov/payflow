import { AppSettings } from './AppSettingsType';
import { ProfileType } from './ProfileType';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType | undefined;
  isMiniApp: boolean;
  isFrameV2: boolean;
}
