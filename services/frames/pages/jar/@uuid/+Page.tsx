import { useData } from 'vike-react/useData';
import type { Data } from './+data';

export default function Page() {
  const jar = useData<Data>();
  return (
    <>
      <h1 style={{ fontWeight: 'bold' }}>{jar.flow.title}</h1>
      Description: {jar.description}
      <br />
      Created by: {jar.profile.displayName} @{jar.profile.username}
      <br />
      {jar.image && <img src={jar.image} alt="Jar" />}
    </>
  );
}
