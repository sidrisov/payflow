import { useQuery } from '@tanstack/react-query';
import { FlowWalletType, WalletWithProfileType } from '../../types/FlowType';
import { sortAndFilterFlowWallets } from '../sortAndFilterFlows';
import { API_URL } from '../urlConstants';
import { TxInfo } from '../../types/ActivityFetchResultType';
import { PaymentType } from '../../types/PaymentType';
import axios from 'axios';
import { baseSepolia, base, optimism, zora, degen } from 'viem/chains';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';

export const useTransactions = (wallets: FlowWalletType[]) => {
  const { profile } = useContext(ProfileContext);

  return useQuery({
    enabled: wallets.length > 0,
    queryKey: ['balances', { wallets }],
    staleTime: Infinity,
    // optimize refetch, to only fetch latest txs
    refetchInterval: 120_000,
    queryFn: () =>
      Promise.allSettled(wallets.map((wallet) => fetchTransactions(wallet))).then(async (data) => {
        const txs = (
          data
            .filter((result) => result.status === 'fulfilled')
            .map((result) => (result.status === 'fulfilled' ? result.value : undefined))
            .flat(1)
            .filter((tx) => tx) as TxInfo[]
        ).sort((left, right) => right.timestamp.localeCompare(left.timestamp));

        let wallets: any = [];
        txs.forEach((tx) => {
          wallets.push({
            address: tx.from,
            network: tx.chainId
          });
          wallets.push({
            address: tx.to,
            network: tx.chainId
          });
        });

        const { data: walletProfiles } = await axios.post(
          `${API_URL}/api/user/search/wallets`,
          wallets
        );

        const hashes = txs.map((tx) => tx.hash);

        let payments: PaymentType[] = [];
        if (hashes.length > 0) {
          const { status, data } = await axios.get(`${API_URL}/api/payment`, {
            params: { hashes },
            paramsSerializer: {
              indexes: null
            },
            withCredentials: true
          });

          if (status === 200 && data) {
            payments = data;
          }
        }

        if ((walletProfiles && walletProfiles.length > 0) || (payments && payments.length > 0)) {
          txs.forEach((tx) => {
            const fromProfile = walletProfiles.find(
              (w: WalletWithProfileType) => w.address === tx.from && w.network === tx.chainId
            )?.profile;

            const toProfile = walletProfiles.find(
              (w: WalletWithProfileType) => w.address === tx.to && w.network === tx.chainId
            )?.profile;

            // TODO: for now filter here, need to do at the top level, or even on back-end, to request the list of chains
            if (fromProfile) {
              tx.fromProfile = {
                ...fromProfile,
                defaultFlow: sortAndFilterFlowWallets(fromProfile.defaultFlow)
              };
            }

            if (toProfile) {
              tx.toProfile = {
                ...toProfile,
                defaultFlow: sortAndFilterFlowWallets(toProfile.defaultFlow)
              };
            }

            const payment = payments.find((p) => p.hash === tx.hash);
            if (payment) {
              tx.payment = payment;
            }

            return tx;
          });
          return txs;
        }
      })
  });
};

interface NextPageParams {
  block_number: number;
  index: number;
  items_count: number;
  transaction_index: number;
}

function parseTxHistoryResponse(
  wallet: FlowWalletType,
  internalTxs: any[],
  erc20txs: any[],
  txs: any[]
): TxInfo[] {
  if (!internalTxs || !txs) {
    return [];
  }

  console.log('Internal Txs: ', internalTxs);

  const uniqueHashes: { [key: string]: boolean } = {};
  const uniqueFromToGasLimitValue: { [key: string]: boolean } = {};

  const interalTxsInfo: TxInfo[] = internalTxs
    .filter((item: any) => {
      if (uniqueHashes[item.transaction_hash]) {
        return false;
      }
      uniqueHashes[item.transaction_hash] = true;

      const fromToGasLimitValueKey = `${item.from?.hash}_${item.to?.hash}_${item.gas_limit}_${item.value}`;
      if (uniqueFromToGasLimitValue[fromToGasLimitValueKey]) {
        return false;
      }
      uniqueFromToGasLimitValue[fromToGasLimitValueKey] = true;
      return true;
    })
    .map((item: any) => {
      const txInfo: TxInfo = {
        chainId: wallet.network,
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

  const erc20TxsInfo: TxInfo[] = erc20txs
    .filter((item: any) => {
      if (uniqueHashes[item.tx_hash]) {
        return false;
      }
      uniqueHashes[item.tx_hash] = true;
      return true;
    })
    .map((item: any) => {
      const txInfo: TxInfo = {
        chainId: wallet.network,
        block: item.block,
        success: true,
        hash: item.tx_hash,
        timestamp: item.timestamp,
        from: item.from?.hash,
        to: item.to?.hash,
        type: item.type,
        value: item.total.value,
        token: item.token,
        activity:
          item.to?.hash === item.from?.hash
            ? 'self'
            : wallet.address === item.to?.hash
            ? 'inbound'
            : 'outbound'
      };
      return txInfo;
    });

  const txsInfo: TxInfo[] = txs
    .filter((item: any) => {
      if (uniqueHashes[item.hash]) {
        return false;
      }
      uniqueHashes[item.hash] = true;
      return true;
    })
    .map((item: any) => {
      const txInfo: TxInfo = {
        chainId: wallet.network,
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

  return interalTxsInfo
    .concat(erc20TxsInfo)
    .concat(txsInfo)
    .filter(
      (tx) =>
        (tx.type === 'call' || tx.type === 2 || tx.type === 'token_transfer') &&
        tx.to !== '0x3AC05161b76a35c1c28dC99Aa01BEd7B24cEA3bf' &&
        tx.value > 0 &&
        tx.success &&
        (tx.token ? ['USDC', 'DEGEN'].includes(tx.token.symbol) : true)
    );
}

async function fetchTransactions(wallet: FlowWalletType): Promise<TxInfo[]> {
  if (!wallet) {
    return [];
  }

  const internalTxsUrl = getWalletInternalTxsFetchAPI(wallet);
  const erc20TxsUrl = getWalletErc20TxsFetchAPI(wallet);
  const txsUrl = getWalletTxsFetchAPI(wallet);

  if (!internalTxsUrl || !txsUrl) {
    return [];
  }

  const internalTxs = internalTxsUrl ? await fetchAnyTxs(internalTxsUrl) : [];
  const erc20Txs = erc20TxsUrl ? await fetchAnyTxs(erc20TxsUrl) : [];
  const txs = txsUrl ? await fetchAnyTxs(txsUrl) : [];

  const txInfos: TxInfo[] = parseTxHistoryResponse(wallet, internalTxs, erc20Txs, txs);

  console.log('Aggregated txs:', txInfos);

  return txInfos;
}

// TODO: later introduce the page number limit
async function fetchAnyTxs(url: string, params?: NextPageParams): Promise<any[]> {
  try {
    const response = await axios.get(url.concat(getNextPageParamsUrlProps(params)), {
      timeout: 2000
    });
    if (response.status !== 200 || !response.data) {
      return [];
    }

    let items: any[] = response.data.items;
    const nextPageParams = response.data.next_page_params as NextPageParams;

    // fixing weird bug when blockscout returns the same params in deadlock
    // check if params are propers
    if (
      nextPageParams &&
      nextPageParams.block_number &&
      nextPageParams.index &&
      nextPageParams.items_count
    ) {
      try {
        const nextPageItems = await fetchAnyTxs(url, nextPageParams);

        if (nextPageItems) {
          items = items.concat(nextPageItems);
        }
      } catch (error) {
        console.error(error);
      }
    }
    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function getNextPageParamsUrlProps(params?: NextPageParams) {
  if (!params) {
    return '';
  }
  return `?block_number=${params.block_number ?? ''}&index=${params.index ?? ''}&items_count=${
    params.items_count ?? ''
  }&transaction_index=${params.transaction_index ?? ''}`;
}

function getWalletInternalTxsFetchAPI(wallet: FlowWalletType): string | undefined {
  let baseUrl = getBlockscoutBaseUrl(wallet.network);

  if (baseUrl) {
    return baseUrl.concat(`/api/v2/addresses/${wallet.address}/internal-transactions`);
  }
}

function getWalletTxsFetchAPI(wallet: FlowWalletType): string | undefined {
  let baseUrl = getBlockscoutBaseUrl(wallet.network);

  if (baseUrl) {
    return baseUrl.concat(`/api/v2/addresses/${wallet.address}/transactions`);
  }
}

function getWalletErc20TxsFetchAPI(wallet: FlowWalletType): string | undefined {
  let baseUrl = getBlockscoutBaseUrl(wallet.network);

  if (baseUrl) {
    return baseUrl.concat(`/api/v2/addresses/${wallet.address}/token-transfers`);
  }
}

function getBlockscoutBaseUrl(chainId: number) {
  let baseUrl;

  switch (chainId) {
    case baseSepolia.id:
      baseUrl = 'https://base-sepolia.blockscout.com';
      break;
    case base.id:
      baseUrl = 'https://base.blockscout.com';
      break;
    case optimism.id:
      baseUrl = 'https://optimism.blockscout.com';
      break;
    case zora.id:
      baseUrl = 'https://explorer.zora.energy';
      break;
    case degen.id:
      baseUrl = 'https://explorer.degen.tips';
      break;
  }

  return baseUrl;
}
