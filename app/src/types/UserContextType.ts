import { AppSettings } from './AppSettingsType';
import { ProfileType } from './ProfileType';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType | undefined;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}
