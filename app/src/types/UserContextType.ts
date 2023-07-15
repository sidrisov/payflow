import { AppSettings } from './AppSettingsType';

export interface UserContextType {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
}
