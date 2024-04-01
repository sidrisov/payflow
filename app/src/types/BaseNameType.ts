import { Address } from 'viem';

export interface BaseNameReponseType {
  statusCode: number;
  name: string;
  address: Address | undefined;
}
