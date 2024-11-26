import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      gcTime: 1000 * 60 * 5, // 5 minutes,
      refetchInterval: 120_000
    }
  }
});

export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage
});
