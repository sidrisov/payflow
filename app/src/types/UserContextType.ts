import { AppSettings } from './AppSettingsType';

export interface UserContextType {
  isWalletConnected: boolean;
  userAddress: string | undefined;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}
