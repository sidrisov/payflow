import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../urlConstants';
import axios from 'axios';
import { PaymentType } from '../../types/PaymentType';
import { useInfiniteQuery } from '@tanstack/react-query';

export const usePendingPayments = (enabled: boolean) => {
  return useQuery({
    enabled,
    queryKey: ['pendingPayments'],
    staleTime: 120_000,
    refetchInterval: 30_000,
    queryFn: () =>
      axios
        .get(`${API_URL}/api/payment/pending`, {
          withCredentials: true
        })
        .then((res) => {
          const payments = res.data as PaymentType[];
          console.log('Fetched pending payments: ', payments);
          return payments;
        })
  });
};

interface PaginatedResponse {
  content: PaymentType[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;
}

export const useCompletedPayments = (identity: string, size: number = 25) => {
  return useInfiniteQuery<PaginatedResponse, Error>({
    queryKey: ['completedPayments', identity],
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    queryFn: ({ pageParam = 0 }) =>
      axios
        .get<PaginatedResponse>(`${API_URL}/api/payment/completed`, {
          params: { identity, page: pageParam, size },
          withCredentials: true
        })
        .then((res) => {
          console.log('Fetched completed payments: ', res.data);
          return res.data;
        })
  });
};
