import { Abi } from 'viem';

export type RequestWalletActionMessage = {
  jsonrpc: '2.0';
  id: string | number | null;
  method: 'fc_requestWalletAction';
  params: RequestWalletActionParams;
};

export type RequestWalletActionParams = {
  action: EthSendTransactionAction | EthSignTypedDataV4Action;
};

export type EthSendTransactionAction = {
  chainId: string;
  method: 'eth_sendTransaction';
  attribution?: boolean;
  params: {
    abi: Abi | [];
    to: string;
    value?: string;
    data?: string;
  };
};

export type EthSignTypedDataV4Action = {
  chainId: string;
  method: 'eth_signTypedData_v4';
  params: {
    domain: {
      name?: string;
      version?: string;
      chainId?: number;
      verifyingContract?: string;
    };
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  };
};

export type TransactionResponse = TransactionResponseSuccess | TransactionResponseFailure;

type TransactionResponseSuccess = {
  jsonrpc: '2.0';
  id: string | number | null;
  result: TransactionSuccessBody;
};

type TransactionSuccessBody = EthSendTransactionSuccessBody | EthSignTypedDataV4SuccessBody;

export type EthSendTransactionSuccessBody = {
  address: string;
  transactionHash: string;
};

export type EthSignTypedDataV4SuccessBody = {
  address: string;
  signature: string;
};

export type TransactionResponseFailure = {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
  };
};
