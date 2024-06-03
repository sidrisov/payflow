import { useData } from 'vike-react/useData';
import type { Data } from './+data';

export default function Page() {
  const payment = useData<Data>();

  console.log(payment);
  return (
    <>
      <h1 style={{ fontWeight: 'bold' }}>
        Amount: {payment.tokenAmount ? payment.tokenAmount : `$${payment.usdAmount}`}{' '}
        {payment.token} {payment.chainId}
      </h1>
      <br />
      Type: {payment.type}
      <br />
      Recipient: {payment.receiver ? `@${payment.receiver.username}` : payment.receiverAddress}
      {payment.sender && (
        <>
          <br />
          Created by: @{payment.sender.username}
        </>
      )}
      <br />
      Status: {payment.status}
      {payment.source && (
        <>
          <br />
          App: {payment.source.app}
          <br />
          Cast: {payment.source.ref}
        </>
      )}
    </>
  );
}
