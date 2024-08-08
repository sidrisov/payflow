import { usePageContext } from 'vike-react/usePageContext';

export default function Page() {
  const { routeParams } = usePageContext();
  const fid = routeParams?.fid;
  return (
    <>
      <span>Buy storage for {fid}</span>
    </>
  );
}
