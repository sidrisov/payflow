import { Stack } from '@mui/material';

import { JsonRpcSigner } from 'ethers';

import { useContext, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Id, toast } from 'react-toastify';

import { Address } from 'viem';

import { useEthersSigner } from '../../utils/hooks/useEthersSigner';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { IdentityType } from '../../types/ProfleType';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { ProfileContext } from '../../contexts/UserContext';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { useSafeTransfer } from '../../utils/hooks/useSafeTransfer';
import { updateWallet } from '../../services/flow';
import {
  estimateFee as estimateSafeTransferFee,
  isSafeSponsored
} from '../../utils/safeTransactions';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { useEthersProvider } from '../../utils/hooks/useEthersProvider';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { Token } from '../../utils/erc20contracts';
import { RecipientField } from '../RecipientField';
import { TokenAmountSection } from './TokenAmountSection';
import { GasFeeSection } from './GasFeeSection';
import { SwitchFlowSignerSection } from './SwitchFlowSignerSection';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';

export default function AccountSendDialog({
  setOpenSearchIdentity,
  sender,
  recipient
}: PaymentDialogProps) {
  const { profile } = useContext(ProfileContext);

  const ethersSigner = useEthersSigner();
  const ethersProvider = useEthersProvider();

  const { address, chain } = useAccount();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const compatibleWallets = useCompatibleWallets({ sender, recipient });
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const toAddress = useToAddress({ recipient, selectedWallet });

  const [sendAmount, setSendAmount] = useState<bigint>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number>();

  const sendToastId = useRef<Id>();

  const [gasFee, setGasFee] = useState<bigint>();

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

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
    setGasFee(undefined);

    if (
      selectedWallet &&
      ethersProvider &&
      selectedWallet.network === Number((await ethersProvider.getNetwork()).chainId)
    ) {
      const sponsored = await isSafeSponsored(ethersProvider, selectedWallet.address);
      setGasFee(
        BigInt(
          sponsored
            ? 0
            : await estimateSafeTransferFee(selectedWallet.deployed, selectedWallet.network)
        )
      );
    }
  }, [selectedWallet, ethersProvider]);

  useMemo(async () => {
    if (!sendAmountUSD || !selectedWallet) {
      return;
    }

    if (loading && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent
          from={{ type: 'profile', identity: { profile: profile } as IdentityType }}
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
            from={{ type: 'profile', identity: { profile: profile } as IdentityType }}
            to={recipient}
            usdAmount={sendAmountUSD ?? 0}
          />
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;

      // if tx was successfull, mark wallet as deployed if it wasn't
      if (!selectedWallet.deployed) {
        selectedWallet.deployed = true;
        updateWallet((sender as FlowType).uuid, selectedWallet);
      }
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={{ type: 'profile', identity: { profile: profile } as IdentityType }}
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
        toast.error('Insufficient Gas Fees', { closeButton: false, autoClose: 5000 });
      }
    }
  }, [loading, confirmed, error, status, txHash, sendAmountUSD]);

  async function submitTransaction() {
    if (selectedWallet && toAddress && sendAmount && ethersSigner) {
      await sendSafeTransaction(
        sender as FlowType,
        selectedWallet,
        toAddress,
        sendAmount,
        ethersSigner
      );
    } else {
      toast.error("Can't send to this profile");
    }
  }

  async function sendSafeTransaction(
    flow: FlowType,
    from: FlowWalletType,
    to: Address,
    amount: bigint,
    ethersSigner: JsonRpcSigner
  ) {
    reset();

    const txData = {
      from: from.address,
      to,
      token: selectedToken,
      amount
    };

    const safeAccountConfig: SafeAccountConfig = {
      owners: [flow.owner],
      threshold: 1
    };

    const saltNonce = flow.saltNonce as string;
    const safeVersion = from.version as SafeVersion;

    transfer(ethersSigner, txData, safeAccountConfig, safeVersion, saltNonce);
  }

  useMemo(async () => {
    setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
  }, [loading, txHash, confirmed, error]);

  useMemo(async () => {
    setPaymentEnabled(Boolean(toAddress && sendAmount));
  }, [toAddress, sendAmount]);

  return (
    <>
      {address &&
        (address.toLowerCase() === (sender as FlowType).owner.toLowerCase() ? (
          selectedWallet && (
            <>
              <Stack width="100%" spacing={2} alignItems="flex-start">
                <RecipientField
                  recipient={recipient}
                  setOpenSearchIdentity={setOpenSearchIdentity}
                />
                <TokenAmountSection
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
                <GasFeeSection selectedToken={selectedToken} gasFee={gasFee} />
              </Stack>
              {chain?.id === selectedWallet.network ? (
                <LoadingPaymentButton
                  title="Send"
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
          <SwitchFlowSignerSection flow={sender as FlowType} />
        ))}
    </>
  );
}
