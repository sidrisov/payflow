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
import { Token } from '../../utils/erc20contracts';
import { TokenAmountSection } from './TokenAmountSection';
import { SwitchFlowSignerSection } from './SwitchFlowSignerSection';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { completePayment, submitPayment } from '../../services/payments';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { PaymentType } from '../../types/PaymentType';
import { delay } from '../../utils/delay';
import { Stack, Typography, useMediaQuery } from '@mui/material';
import ResponsiveDialog from './ResponsiveDialog';
import { grey } from '@mui/material/colors';

export default function PaymentDialogContent({
  paymentType,
  payment,
  sender,
  recipient
}: PaymentDialogProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const senderAddress = sender.identity.address as Address;
  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const { profile } = useContext(ProfileContext);

  const { data: signer } = useWalletClient();
  const client = useClient();

  const { address } = useAccount();
  const chainId = useChainId();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  // TODO: move everything to flows
  const compatibleWallets = useCompatibleWallets({
    sender: paymentType === 'payflow' ? senderFlow : senderAddress,
    recipient,
    payment
  });
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const toAddress = useToAddress({ recipient, selectedWallet });

  const [sendAmount, setSendAmount] = useState<number | undefined>(payment?.tokenAmount ?? 0);
  const [sendAmountUSD, setSendAmountUSD] = useState<number | undefined>(payment?.usdAmount);
  const sendToastId = useRef<Id>();

  const isNativeFlow =
    paymentType === 'payflow' &&
    senderFlow.type !== 'FARCASTER_VERIFICATION' &&
    senderFlow.type !== 'LINKED';

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

  const [openConnectSignerDrawer, setOpenConnectSignerDrawer] = useState<boolean>(false);

  const {
    loading: loadingRegular,
    confirmed: confirmedRegular,
    error: errorRegular,
    status: statusRegular,
    txHash: txHashRegular,
    sendTransactionAsync,
    reset: resetRegular
  } = useRegularTransfer();

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  // TODO: use pre-configured tokens to fetch decimals, etc
  const { data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId,
    token: selectedToken?.tokenAddress,
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

    const loadingCombined = isNativeFlow ? loading : loadingRegular;
    const confirmedCombined = isNativeFlow ? confirmed : confirmedRegular;
    const errorCombined = isNativeFlow ? error : errorRegular;
    const statusCombined = isNativeFlow ? status : statusRegular;
    const txHashCombined = isNativeFlow ? txHash : txHashRegular;

    if (loadingCombined && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent from={sender} to={recipient} usdAmount={sendAmountUSD ?? 0} />
      );
    }

    if (!sendToastId.current) {
      return;
    }

    if (confirmedCombined && txHashCombined) {
      console.debug('Confirmed with txHash: ', txHashCombined);

      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent from={sender} to={recipient} usdAmount={sendAmountUSD ?? 0} />
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;

      if (profile) {
        if (payment?.referenceId) {
          payment.hash = txHashCombined;
          await completePayment(payment);
        } else {
          const newPayment = {
            type: 'APP',
            status: 'COMPLETED',
            receiver: recipient.identity.profile,
            receiverAddress: toAddress,
            chainId: chainId,
            token: selectedToken?.id,
            tokenAmount: sendAmount,
            hash: txHashCombined
          } as PaymentType;

          console.log('Submitting payment: ', newPayment);
          await submitPayment(newPayment);
        }

        // if tx was successfull, mark wallet as deployed if it wasn't
        if (isNativeFlow && !selectedWallet.deployed) {
          selectedWallet.deployed = true;
          await updateWallet(senderFlow.uuid, selectedWallet);
        }
      }

      await delay(2000);
      window.location.href = '/';
    } else if (errorCombined) {
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

      if (statusCombined === 'insufficient_fees') {
        toast.error('Insufficient gas fees', { closeButton: false, autoClose: 5000 });
      }

      if (statusCombined?.includes('gas_sponsorship_failure')) {
        toast.error(`Failed to sponsor tx: ${statusCombined.split(':')[1]}`, {
          closeButton: false,
          autoClose: 5000
        });
      }
    }
  }, [
    loading,
    confirmed,
    error,
    status,
    txHash,
    loadingRegular,
    confirmedRegular,
    errorRegular,
    statusRegular,
    txHashRegular,
    sendAmountUSD
  ]);

  async function submitTransaction() {
    if (paymentType !== 'wallet' && address?.toLowerCase() !== senderFlow.signer.toLowerCase()) {
      setOpenConnectSignerDrawer(true);
      return;
    }

    if (
      selectedWallet &&
      toAddress &&
      sendAmount &&
      selectedToken &&
      balance &&
      client &&
      signer &&
      profile
    ) {
      if (isNativeFlow) {
        await sendSafeTransaction(
          client,
          signer,
          profile,
          senderFlow,
          selectedWallet,
          toAddress,
          parseUnits(sendAmount.toString(), balance.decimals)
        );
      } else {
        resetRegular();
        if (selectedToken.tokenAddress) {
          await sendTransactionAsync?.({
            to: selectedToken.tokenAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [toAddress, parseUnits(sendAmount.toString(), balance.decimals)]
            })
          });
        } else {
          await sendTransactionAsync?.({
            to: toAddress,
            value: parseUnits(sendAmount.toString(), balance.decimals)
          });
        }
      }
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
      selectedToken && selectedToken.tokenAddress
        ? {
            from: from.address,
            to: selectedToken.tokenAddress,
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
    if (isNativeFlow) {
      setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
    } else {
      setPaymentPending(
        Boolean(loadingRegular || (txHashRegular && !confirmedRegular && !errorRegular))
      );
    }
  }, [
    loading,
    txHash,
    confirmed,
    error,
    loadingRegular,
    txHashRegular,
    confirmedRegular,
    errorRegular
  ]);

  useMemo(async () => {
    setPaymentEnabled(Boolean(toAddress && sendAmount && sendAmountUSD));
  }, [toAddress, sendAmount, sendAmountUSD]);

  return (
    <>
      {selectedWallet && (
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
              status={isNativeFlow ? status : statusRegular}
              onClick={submitTransaction}
            />
          ) : (
            <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
          )}
        </>
      )}
      {paymentType !== 'wallet' && address?.toLowerCase() !== senderFlow.signer.toLowerCase() && (
        <ResponsiveDialog
          title="Connect Signer"
          open={openConnectSignerDrawer}
          onOpen={() => {
            setOpenConnectSignerDrawer(true);
          }}
          onClose={() => setOpenConnectSignerDrawer(false)}>
          <Stack alignItems="flex-start" spacing={2}>
            <Typography variant="caption" color={grey[prefersDarkMode ? 400 : 700]}>
              Selected payment flow `<b>{senderFlow.title}`</b> signer is not connected! Please,
              proceed with connecting the wallet mentioned below.
            </Typography>
            <SwitchFlowSignerSection flow={senderFlow} />
          </Stack>
        </ResponsiveDialog>
      )}
    </>
  );
}
