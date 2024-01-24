import { Chain } from 'viem';
import { AppSettings } from './AppSettingsType';
import { ProfileType } from './ProfleType';

export interface ProfileContextType {
  isAuthenticated: boolean;
  profile: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  smartAccountAllowedChains: Chain[];
  setSmartAccountAllowedChains: React.Dispatch<React.SetStateAction<Chain[]>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
  ethUsdPrice: number | undefined;
}

export interface AnonymousUserContextType {
  profile?: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  ethUsdPrice: number | undefined;
}
