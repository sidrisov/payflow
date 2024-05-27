import { useContext, useMemo, useRef, useState } from 'react';
import { useAccount, useBalance, useChainId, useClient, useWalletClient } from 'wagmi';
import { Id, toast } from 'react-toastify';

import {
  Account,
  Address,
  Chain,
  Client,
  Transport,
  WalletClient,
  encodeFunctionData,
  erc20Abi,
  parseUnits
} from 'viem';

import { FlowType, FlowWalletType } from '../../types/FlowType';
import { ProfileType } from '../../types/ProfleType';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { ProfileContext } from '../../contexts/UserContext';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { useSafeTransfer } from '../../utils/hooks/useSafeTransfer';
import { updateWallet } from '../../services/flow';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { DEGEN_TOKEN, ETH, Token } from '../../utils/erc20contracts';
import { TokenAmountSection } from './TokenAmountSection';
import { SwitchFlowSignerSection } from './SwitchFlowSignerSection';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { completePayment } from '../../services/payments';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { degen } from 'viem/chains';

export default function PayWithPayflowDialog({ payment, sender, recipient }: PaymentDialogProps) {
  const flow = sender.identity.profile?.defaultFlow as FlowType;

  const { profile } = useContext(ProfileContext);

  const { data: signer } = useWalletClient();
  const client = useClient();

  const { address } = useAccount();
  const chainId = useChainId();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const compatibleWallets = useCompatibleWallets({ sender: flow, recipient, payment });
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const toAddress = useToAddress({ recipient, selectedWallet });

  const [sendAmount, setSendAmount] = useState<number | undefined>(payment?.tokenAmount);
  const [sendAmountUSD, setSendAmountUSD] = useState<number | undefined>(payment?.usdAmount);
  const sendToastId = useRef<Id>();

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

  // force to display sponsored
  const [gasFee] = useState<bigint>(BigInt(0));

  // TODO: use pre-configured tokens to fetch decimals, etc
  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId,
    token: selectedToken !== ETH ? selectedToken?.address : undefined,
    query: {
      enabled: selectedWallet !== undefined && selectedToken !== undefined,
      gcTime: 5000
    }
  });

  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setSelectedWallet(undefined);
      return;
    }
    setSelectedWallet(compatibleWallets.find((w) => w.network === chainId) ?? compatibleWallets[0]);
  }, [compatibleWallets, chainId]);

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

      // if tx was successfull, mark wallet as deployed if it wasn't
      if (!selectedWallet.deployed) {
        selectedWallet.deployed = true;
        updateWallet(flow.uuid, selectedWallet);
      }
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

      if (status === 'insufficient_fees') {
        toast.error('Insufficient gas fees', { closeButton: false, autoClose: 5000 });
      }

      if (status?.includes('gas_sponsorship_failure')) {
        toast.error(`Failed to sponsor tx: ${status.split(':')[1]}`, {
          closeButton: false,
          autoClose: 5000
        });
      }
    }
  }, [loading, confirmed, error, status, txHash, sendAmountUSD]);

  async function submitTransaction() {
    if (selectedWallet && toAddress && sendAmount && balance && client && signer && profile) {
      await sendSafeTransaction(
        client,
        signer,
        profile,
        flow,
        selectedWallet,
        toAddress,
        parseUnits(sendAmount.toString(), balance.decimals)
      );
    } else {
      toast.error("Can't send to this profile");
    }
  }

  async function sendSafeTransaction(
    client: Client<Transport, Chain>,
    signer: WalletClient<Transport, Chain, Account>,
    profile: ProfileType,
    flow: FlowType,
    from: FlowWalletType,
    to: Address,
    amount: bigint
  ) {
    reset();

    const txData =
      selectedToken &&
      selectedToken !== ETH &&
      (chainId !== degen.id || selectedToken.name !== DEGEN_TOKEN)
        ? {
            from: from.address,
            to: selectedToken.address,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [to, amount]
            })
          }
        : {
            from: from.address,
            to,
            value: amount
          };

    // TODO: hard to figure out if there 2 signers or one, for now consider if signerProvider not specified - 1, otherwise - 2
    const owners = [];
    if (flow.signerProvider && flow.signer.toLowerCase() !== profile.identity.toLowerCase()) {
      owners.push(profile.identity);
    }
    owners.push(flow.signer);

    const safeAccountConfig: SafeAccountConfig = {
      owners,
      threshold: 1
    };

    const saltNonce = flow.saltNonce as string;
    const safeVersion = from.version as SafeVersion;

    transfer(client, signer, txData, safeAccountConfig, safeVersion, saltNonce);
  }

  useMemo(async () => {
    setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
  }, [loading, txHash, confirmed, error]);

  useMemo(async () => {
    setPaymentEnabled(Boolean(toAddress && sendAmount));
  }, [toAddress, sendAmount]);

  return (
    <>
      {address?.toLowerCase() === flow.signer.toLowerCase() ? (
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
            {chainId === selectedWallet.network ? (
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
      ) : (
        <SwitchFlowSignerSection flow={flow} />
      )}
    </>
  );
}
