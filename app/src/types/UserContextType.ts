import { AccountType } from './AccountType';
import { AppSettings } from './AppSettingsType';
import { FlowType } from './FlowType';
import { ProfileType } from './ProfleType';

export interface UserContextType {
  isAuthenticated: boolean;
  profile: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  flows: FlowType[] | undefined;
  setFlows: React.Dispatch<React.SetStateAction<FlowType[] | undefined>>;
  smartAccountAllowedChains: string[];
  setSmartAccountAllowedChains: React.Dispatch<React.SetStateAction<string[]>>;
  setInitiateFlowsRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  walletBalances: Map<string, bigint>;
  setWalletBalances: React.Dispatch<React.SetStateAction<Map<string, bigint>>>;
  ethUsdPrice: number | undefined;
}
