import { AccountType } from './AccountType';
import { AppSettings } from './AppSettingsType';

export interface UserContextType {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  accounts: AccountType[] | undefined;
  setAccounts: React.Dispatch<React.SetStateAction<AccountType[] | undefined>>;
  smartAccountAllowedChains: string[];
  setSmartAccountAllowedChains: React.Dispatch<React.SetStateAction<string[]>>;
  setInitiateRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
}
