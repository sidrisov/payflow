import { useMemo, useRef, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Id, toast } from 'react-toastify';

import { Address, erc20Abi, parseUnits } from 'viem';

import { FlowWalletType } from '../../types/FlowType';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { DEGEN_TOKEN, ETH, ETH_TOKEN, Token } from '../../utils/erc20contracts';
import { TokenAmountSection } from './TokenAmountSection';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { completePayment } from '../../services/payments';
import { degen } from 'viem/chains';
import { NetworkTokenSelector } from '../NetworkTokenSelector';

export default function PayWithEOADialog({ sender, recipient, payment }: PaymentDialogProps) {
  const senderAddress = sender.identity.address as Address;

  const { chain } = useAccount();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const compatibleWallets = useCompatibleWallets({
    sender: senderAddress,
    recipient
  });
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const toAddress = useToAddress({ recipient, selectedWallet });

  const [sendAmount, setSendAmount] = useState<number>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number | undefined>(payment?.usdAmount);

  // force to display sponsored
  const [gasFee] = useState<bigint>(BigInt(0));

  // TODO: use pre-configured tokens to fetch decimals, etc
  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id,
    token: selectedToken !== ETH ? selectedToken?.address : undefined,
    query: {
      enabled: selectedWallet !== undefined && selectedToken !== undefined,
      gcTime: 5000
    }
  });

  const sendToastId = useRef<Id>();

  const { loading, confirmed, error, status, txHash, sendTransaction, writeContract, reset } =
    useRegularTransfer();

  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setSelectedWallet(undefined);
      return;
    }
    setSelectedWallet(
      (chain && compatibleWallets.find((w) => w.network === chain.id)) ?? compatibleWallets[0]
    );
  }, [compatibleWallets, chain]);

  useMemo(async () => {
    if (!sendAmountUSD || !selectedWallet) {
      return;
    }

    if (loading && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent from={sender} to={recipient} usdAmount={sendAmountUSD ?? 0} />
      );
    }

    if (!sendToastId.current) {
      return;
    }

    if (confirmed) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent from={sender} to={recipient} usdAmount={sendAmountUSD ?? 0} />
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;

      if (payment?.referenceId) {
        payment.hash = txHash;
        completePayment(payment);
      }

      reset();
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={sender}
            to={recipient}
            usdAmount={sendAmountUSD ?? 0}
            status="error"
          />
        ),
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;
      reset();
    }
  }, [loading, confirmed, error, txHash, sendAmountUSD]);

  async function submitTransaction() {
    if (!toAddress || !sendAmount || !selectedToken || !balance) {
      return;
    }

    if (
      selectedToken.name === ETH_TOKEN ||
      (chain?.id === degen.id && selectedToken.name === DEGEN_TOKEN)
    ) {
      sendTransaction?.({
        to: toAddress,
        value: parseUnits(sendAmount.toString(), balance.decimals)
      });
    } else {
      writeContract?.({
        abi: erc20Abi,
        address: selectedToken.address,
        functionName: 'transfer',
        args: [toAddress, parseUnits(sendAmount.toString(), balance.decimals)]
      });
    }
  }

  useMemo(async () => {
    setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
  }, [loading, txHash, confirmed, error]);

  useMemo(async () => {
    setPaymentEnabled(Boolean(toAddress && sendAmount));
  }, [toAddress, sendAmount]);

  return (
    selectedWallet && (
      <>
        <TokenAmountSection
          payment={payment}
          selectedWallet={selectedWallet}
          selectedToken={selectedToken}
          sendAmount={sendAmount}
          setSendAmount={setSendAmount}
          sendAmountUSD={sendAmountUSD}
          setSendAmountUSD={setSendAmountUSD}
        />
        <NetworkTokenSelector
          payment={payment}
          selectedWallet={selectedWallet}
          setSelectedWallet={setSelectedWallet}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          compatibleWallets={compatibleWallets}
          gasFee={gasFee}
        />
        {chain?.id === selectedWallet.network ? (
          <LoadingPaymentButton
            title="Pay"
            loading={paymentPending}
            disabled={!paymentEnabled}
            status={status}
            onClick={submitTransaction}
          />
        ) : (
          <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
        )}
      </>
    )
  );
}
