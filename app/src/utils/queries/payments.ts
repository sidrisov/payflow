import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../urlConstants';
import axios from 'axios';
import { PaymentType } from '../../types/PaymentType';

export const usePendingPayments = (enabled: boolean) => {
  return useQuery({
    enabled,
    queryKey: ['payments'],
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
