import { Chain } from 'viem';
import { AppSettings } from './AppSettingsType';
import { ProfileType } from './ProfleType';
import { TokenPrices } from '../utils/erc20contracts';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  tokenPrices: TokenPrices | undefined;
}
