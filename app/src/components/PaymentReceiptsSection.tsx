import { StackProps } from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { PaymentListSection } from './sections/PaymentSection';

export function PaymentReceiptsSection({
  payments,
  ...props
}: { payments?: PaymentType[] } & StackProps) {
  return <PaymentListSection type="receipt" payments={payments} {...props} />;
}
