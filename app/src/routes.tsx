import { createBrowserRouter } from 'react-router';
import LoadingPayflowEntryLogo from './components/LoadingPayflowEntryLogo';
import Placeholder from './pages/Placeholder';

export const routes = createBrowserRouter([
  {
    path: '*',
    element: <Placeholder />,
    hydrateFallbackElement: <LoadingPayflowEntryLogo />
  }
]);
