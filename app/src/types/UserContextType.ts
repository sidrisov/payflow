import { Chain } from 'viem';
import { AppSettings } from './AppSettingsType';
import { ProfileType } from './ProfleType';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  ethUsdPrice: number | undefined;
  degenUsdPrice: number | undefined;
}
