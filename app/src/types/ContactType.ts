import { Address } from 'viem';
import { ProfileType } from './ProfleType';
import { Wallet } from '../generated/graphql/types';

export interface ContactType {
  identity: Address;
  favouriteAddress: boolean | undefined;
  favouriteProfile: boolean | undefined;
  profile?: ProfileType;
  socialMetadata?: Wallet;
}
