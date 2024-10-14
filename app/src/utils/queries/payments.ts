import { useInfiniteQuery } from '@tanstack/react-query';
import { API_URL } from '../urlConstants';
import axios from 'axios';
import { PaymentStatus, PaymentType } from '../../types/PaymentType';

interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;
}

export const useOutboundPayments = (statuses: PaymentStatus[], size: number = 5) => {
  return useInfiniteQuery<PaginatedResponse<PaymentType>, Error>({
    queryKey: ['outboundPayments', statuses],
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    queryFn: ({ pageParam = 0 }) =>
      axios
        .get<PaginatedResponse<PaymentType>>(`${API_URL}/api/payment/outbound`, {
          params: {
            page: pageParam,
            size,
            statuses: statuses.join(',')
          },
          withCredentials: true
        })
        .then((res) => {
          console.log('Fetched outbound payments for statuses: ', statuses, res.data);
          return res.data;
        }),
    staleTime: 120_000,
    refetchInterval: 30_000
  });
};

export const useCompletedPayments = (identity: string, accessToken?: string, size: number = 25) => {
  return useInfiniteQuery<PaginatedResponse<PaymentType>, Error>({
    queryKey: ['completedPayments', identity],
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    queryFn: ({ pageParam = 0 }) =>
      axios
        .get<PaginatedResponse<PaymentType>>(`${API_URL}/api/payment/completed`, {
          params: {
            identity,
            page: pageParam,
            size,
            ...(accessToken && { access_token: accessToken })
          },
          withCredentials: true
        })
        .then((res) => {
          console.log('Fetched completed payments: ', res.data);
          return res.data;
        })
  });
};
