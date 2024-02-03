import { Skeleton } from '@mui/material';

export const LoadingFarcasterAccountsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton
          key={`farcaster_account_${index}`}
          variant="rectangular"
          height={75}
          sx={{ borderRadius: 5, width: '100%' }}
        />
      ))}
    </>
  );
};
