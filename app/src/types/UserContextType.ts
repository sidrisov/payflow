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
  setInitiateFlowsRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
  ethUsdPrice: number | undefined;
}

export interface AnonymousUserContextType {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}
