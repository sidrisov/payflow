import { useContext, useEffect } from 'react';
import { DegenInfoCard } from '../components/cards/DegenInfoCard';
import PayflowPage from '../components/PayflowPage';
import { ProfileContext } from '../contexts/UserContext';
import { useNavigate } from 'react-router';
export default function ClaimablesPage() {
  const { profile } = useContext(ProfileContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) {
      navigate(`/connect?redirect=/~/claimables`);
    }
  }, []);

  return (
    <PayflowPage title="Claimables" pageTitle="Claimables">
      <DegenInfoCard />
    </PayflowPage>
  );
}
