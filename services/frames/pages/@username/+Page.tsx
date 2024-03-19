import { usePageContext } from 'vike-react/usePageContext';

export default function Page() {
  const { routeParams } = usePageContext();
  const username = routeParams?.username;
  return (
    <>
      <span>{username}</span>
    </>
  );
}
