import { AccountType } from './AccountType';
import { AppSettings } from './AppSettingsType';

export interface UserContextType {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  accounts: AccountType[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountType[]>>;
  smartAccountAllowedChains: string[];
  setSmartAccountAllowedChains: React.Dispatch<React.SetStateAction<string[]>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
}
