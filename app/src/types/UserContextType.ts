import { AccountType } from './AccountType';
import { AppSettings } from './AppSettingsType';
import { FlowType } from './FlowType';

export interface UserContextType {
  isAuthenticated: boolean;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  accounts: AccountType[] | undefined;
  setAccounts: React.Dispatch<React.SetStateAction<AccountType[] | undefined>>;
  flows: FlowType[] | undefined;
  setFlows: React.Dispatch<React.SetStateAction<FlowType[] | undefined>>;
  smartAccountAllowedChains: string[];
  setSmartAccountAllowedChains: React.Dispatch<React.SetStateAction<string[]>>;
  setInitiateAccountsRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  setInitiateFlowsRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
  ethUsdPrice: number | undefined;
}
