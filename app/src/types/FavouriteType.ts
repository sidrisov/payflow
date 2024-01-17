import { Address } from 'viem';

export interface FavouriteType {
  identity: Address;
  addressChecked: boolean | undefined;
  profileChecked: boolean | undefined;
}
