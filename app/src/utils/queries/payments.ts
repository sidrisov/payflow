import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../urlConstants';
import axios from 'axios';
import { PaymentType } from '../../types/PaymentType';

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

import { useInfiniteQuery } from '@tanstack/react-query';

// ... other existing code ...

interface PaginatedResponse {
  content: PaymentType[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    // ... other pageable properties
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;
  // ... other pagination properties
}

export const useCompletedPayments = (identity: string, size: number = 5) => {
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
