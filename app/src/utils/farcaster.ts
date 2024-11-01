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
