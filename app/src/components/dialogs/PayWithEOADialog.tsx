import { Stack } from '@mui/material';

import { useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Id, toast } from 'react-toastify';

import { Address, erc20Abi } from 'viem';

import { FlowWalletType } from '../../types/FlowType';
import { IdentityType } from '../../types/ProfleType';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { ETH_TOKEN, Token } from '../../utils/erc20contracts';
import { RecipientField } from '../RecipientField';
import { TokenAmountSection } from './TokenAmountSection';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { updatePayment } from '../../services/payments';
import { degen } from 'viem/chains';

export default function PayWithEOADialog({ sender, recipient, payment }: PaymentDialogProps) {
  const { chain } = useAccount();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const compatibleWallets = useCompatibleWallets({ sender, recipient });
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const toAddress = useToAddress({ recipient, selectedWallet });

  const [sendAmount, setSendAmount] = useState<bigint>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number | undefined>(payment?.usdAmount);

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
        <TransferToastContent
          from={{ type: 'address', identity: { address: sender as Address } as IdentityType }}
          to={recipient}
          usdAmount={sendAmountUSD ?? 0}
        />
      );
    }

    if (!sendToastId.current) {
      return;
    }

    if (confirmed) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={{ type: 'address', identity: { address: sender as Address } as IdentityType }}
            to={recipient}
            usdAmount={sendAmountUSD ?? 0}
          />
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;

      if (payment?.referenceId) {
        payment.hash = txHash;
        updatePayment(payment);
      }

      reset();
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={{ type: 'address', identity: { address: sender as Address } as IdentityType }}
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
    if (!toAddress || !sendAmount || !selectedToken) {
      return;
    }

    if (selectedToken.name === ETH_TOKEN || chain?.id === degen.id) {
      sendTransaction?.({ to: toAddress, value: sendAmount });
    } else {
      writeContract?.({
        abi: erc20Abi,
        address: selectedToken.address,
        functionName: 'transfer',
        args: [toAddress, sendAmount]
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
        <Stack width="100%" spacing={2} alignItems="center">
          <RecipientField recipient={recipient} />
          <TokenAmountSection
            payment={payment}
            selectedWallet={selectedWallet}
            setSelectedWallet={setSelectedWallet}
            compatibleWallets={compatibleWallets}
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            sendAmount={sendAmount}
            setSendAmount={setSendAmount}
            sendAmountUSD={sendAmountUSD}
            setSendAmountUSD={setSendAmountUSD}
          />
        </Stack>
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
