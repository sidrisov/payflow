import { StackProps } from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { PaymentListSection } from './sections/PaymentSection';

export function PaymentIntentsSection({
  payments,
  ...props
}: {
  payments?: PaymentType[];
} & StackProps) {
  return <PaymentListSection type="intent" payments={payments} {...props} />;
}
