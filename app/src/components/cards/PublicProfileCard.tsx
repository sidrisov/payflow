import { Card, CardProps } from '@mui/material';
import { IdentityType } from '@payflow/common';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails';
import { useSearchParams } from 'react-router-dom';

export function PublicProfileCard({ identity, ...props }: { identity: IdentityType } & CardProps) {
  const [searchParams] = useSearchParams();
  const pay = searchParams.get('pay');

  return (
    <Card
      {...props}
      elevation={5}
      sx={{
        m: 2,
        p: 2,
        borderRadius: 5,
        flexShrink: 0
      }}>
      <PublicProfileDetails openPayDialogParam={pay !== null} identity={identity} />
    </Card>
  );
}
