import { DegenInfoCard } from '../components/cards/DegenInfoCard';
import PayflowPage from '../components/PayflowPage';

export default function ClaimablesPage() {
  return (
    <PayflowPage title="Claimables" pageTitle="Claimables">
      <DegenInfoCard />
    </PayflowPage>
  );
}
