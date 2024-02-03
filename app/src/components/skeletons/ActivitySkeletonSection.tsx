import { Skeleton } from '@mui/material';

export const ActivitySkeletonSection = () => {
  return (
    <>
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
    </>
  );
};
