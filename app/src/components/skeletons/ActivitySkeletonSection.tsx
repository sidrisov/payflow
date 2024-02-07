import { Skeleton } from '@mui/material';

export const ActivitySkeletonSection = () => {
  return (
    <>
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 5 }} />
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 5 }} />
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 5 }} />
    </>
  );
};
