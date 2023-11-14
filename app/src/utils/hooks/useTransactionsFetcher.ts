import { useMemo, useState } from 'react';
import { ActivityFetchResultType, TxInfo } from '../../types/ActivityFetchResultType';
import { FlowWalletType, WalletWithProfileType } from '../../types/FlowType';
import axios from 'axios';
import {
  base,
  baseGoerli,
  modeTestnet,
  optimism,
  optimismGoerli,
  polygonZkEvm,
  polygonZkEvmTestnet,
  zora,
  zoraTestnet
} from 'viem/chains';
import { getNetwork } from 'wagmi/actions';
import { API_URL } from '../urlConstants';

export const useTransactionsFetcher = (wallets: FlowWalletType[]): ActivityFetchResultType => {
  const [transactions, setTransactions] = useState<TxInfo[]>([]);
  const [fetched, setFetched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useMemo(() => {
    setLoading(true);

    Promise.allSettled(wallets.map((wallet) => fetchTransactions(wallet)))
      .then(async (data) => {
        const txs = (
          data
            .filter((result) => result.status === 'fulfilled')
            .map((result) => (result.status === 'fulfilled' ? result.value : undefined))
            .flat(1)
            .filter((tx) => tx) as TxInfo[]
        ).sort((left, right) => right.timestamp.localeCompare(left.timestamp));

        // TODO: get unique
        const wallets = txs.map((tx) => ({
          address: tx.activity in ['inbound', 'self'] ? tx.from : tx.to,
          network: getNetwork().chains.find((c) => c.id === tx.chainId)?.name
        }));

        const { status, data: walletProfiles } = await axios.post(
          `${API_URL}/api/user/search/wallets`,
          wallets
        );

        if (status === 200 && walletProfiles) {
          txs.forEach((tx) => {
            const profile = walletProfiles.find(
              (w: WalletWithProfileType) =>
                w.address === (tx.activity in ['self', 'inbound'] ? tx.from : tx.to) &&
                w.network === getNetwork().chains.find((c) => c.id === tx.chainId)?.name
            ).profile;

            if (profile) {
              tx.profile = profile;
            }
            return tx;
          });
        }
        setLoading(false);
        setFetched(true);
        setTransactions(txs);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        setFetched(false);
      });
    setTransactions([]);
  }, [wallets.toString()]);
  return { loading, fetched, transactions };
};

function parseTxHistoryResponse(wallet: FlowWalletType, internalTxs: any, txs: any): TxInfo[] {
  if (!internalTxs || !txs || !internalTxs.items || !txs.items) {
    return [];
  }

  const chainId = getNetwork().chains.find((c) => c.name === wallet.network)?.id;
  if (!chainId) {
    return [];
  }

  const interalTxsInfo: TxInfo[] = internalTxs.items.map((item: any) => {
    const txInfo: TxInfo = {
      chainId: chainId,
      block: item.block,
      success: item.success,
      hash: item.transaction_hash,
      timestamp: item.timestamp,
      from: item.from?.hash,
      to: item.to?.hash,
      type: item.type,
      value: item.value,
      activity:
        item.to?.hash === item.from?.hash
          ? 'self'
          : wallet.address === item.to?.hash
          ? 'inbound'
          : 'outbound'
    };
    return txInfo;
  });

  const txsInfo: TxInfo[] = txs.items.map((item: any) => {
    const txInfo: TxInfo = {
      chainId: chainId,
      block: item.block,
      success: item.result === 'success',
      hash: item.hash,
      timestamp: item.timestamp,
      from: item.from?.hash,
      to: item.to?.hash,
      type: item.type,
      value: item.value,
      activity:
        item.to?.hash === item.from?.hash
          ? 'self'
          : wallet.address === item.to?.hash
          ? 'inbound'
          : 'outbound'
    };
    return txInfo;
  });

  console.log(txsInfo);

  return interalTxsInfo
    .concat(txsInfo)
    .filter(
      (tx) =>
        (tx.type === 'call' || tx.type === 2) &&
        tx.to !== '0x3AC05161b76a35c1c28dC99Aa01BEd7B24cEA3bf' &&
        tx.value > 0 &&
        tx.success
    );
}

async function fetchTransactions(wallet: FlowWalletType): Promise<TxInfo[]> {
  if (!wallet) {
    return [];
  }

  const internalTxsUrl = getWalletInternalTxsFetchAPI(wallet);
  const txsUrl = getWalletTxsFetchAPI(wallet);

  if (!internalTxsUrl || !txsUrl) {
    return [];
  }

  const internalTxs = await axios.get(internalTxsUrl);
  const txs = await axios.get(txsUrl);

  const txInfos: TxInfo[] = parseTxHistoryResponse(wallet, internalTxs.data, txs.data);

  return txInfos;
}

function getWalletInternalTxsFetchAPI(wallet: FlowWalletType): string | undefined {
  let baseUrl = getBlockscoutBaseUrl(wallet.network);

  if (baseUrl) {
    return baseUrl.concat(
      `/api/v2/addresses/${wallet.address}/internal-transactions?filter=to%20%7C%20from`
    );
  }
}

function getWalletTxsFetchAPI(wallet: FlowWalletType): string | undefined {
  let baseUrl = getBlockscoutBaseUrl(wallet.network);

  if (baseUrl) {
    return baseUrl.concat(
      `/api/v2/addresses/${wallet.address}/transactions?filter=to%20%7C%20from`
    );
  }
}

function getBlockscoutBaseUrl(network: string) {
  let baseUrl;

  switch (network) {
    case baseGoerli.name:
      baseUrl = `https://${baseGoerli.network}.blockscout.com`;
      break;
    case base.name:
      baseUrl = `https://${base.network}.blockscout.com`;
      break;
    case optimismGoerli.name:
      baseUrl = `https://${optimismGoerli.network}.blockscout.com`;
      break;
    case optimism.name:
      baseUrl = `https://${optimism.network}.blockscout.com`;
      break;
    case modeTestnet.name:
      baseUrl = `https://sepolia.explorer.mode.network`;
      break;
    case zoraTestnet.name:
      baseUrl = 'https://testnet.explorer.zora.energy';
      break;
    case zora.name:
      baseUrl = 'https://explorer.zora.energy';
      break;
    case polygonZkEvmTestnet.name:
      baseUrl = 'https://testnet.explorer.zora.energy';
      break;
    case polygonZkEvm.name:
      baseUrl = 'https://explorer.zora.energy';
  }

  return baseUrl;
}
