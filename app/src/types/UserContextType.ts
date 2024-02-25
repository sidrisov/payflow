import { AppSettings } from './AppSettingsType';
import { ProfileType } from './ProfleType';
import { TokenPrices } from '../utils/erc20contracts';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType | undefined;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  tokenPrices: TokenPrices | undefined;
  walletProvider: 'privy' | 'rainbowkit';
}
