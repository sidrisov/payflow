import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { CustomLoadingButton } from './LoadingPaymentButton';
import { LoadingSwitchChainButton } from './LoadingSwitchNetworkButton';
import { Token } from '../../utils/erc20contracts';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { ConnectSignerDialog } from '../dialogs/ConnectSignerDialog';
import { usePayflowTransaction } from '../../utils/hooks/usePayflowTransaction';
import { PaymentType } from '../../types/PaymentType';
import { PaymentOption } from '@paywithglide/glide-js';
import { Hash } from 'viem';
import { usePrivy } from '@privy-io/react-auth';

export type PaymentSuccess = {
  txHash: Hash;
};

type PayButtonProps = {
  paymentToken: Token | undefined;
  buttonText: string;
  disabled: boolean;
  paymentTx: any;
  paymentWallet: FlowWalletType;
  paymentOption: PaymentOption;
  payment: PaymentType;
  senderFlow: FlowType;
  onSuccess: (data: PaymentSuccess) => void;
  onError: (error: any) => void;
};

export const PayButton: React.FC<PayButtonProps> = ({
  paymentToken,
  buttonText,
  disabled,
  paymentTx,
  paymentWallet,
  paymentOption,
  payment,
  senderFlow,
  onSuccess,
  onError
}) => {
  console.debug('Payment in PayButton: ', payment);

  const { ready } = usePrivy();

  const chainId = useChainId();
  const { address } = useAccount();
  const [openConnectSignerDrawer, setOpenConnectSignerDrawer] = useState(false);

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';
  const { handleGlideTransaction, paymentTxStatus } = usePayflowTransaction(isNativeFlow);

  const handleClick = async () => {
    if (address?.toLowerCase() !== senderFlow.signer.toLowerCase()) {
      setOpenConnectSignerDrawer(true);
    } else {
      try {
        const result = await handleGlideTransaction({
          paymentTx,
          paymentWallet,
          paymentOption,
          payment,
          senderFlow
        });
        if (result.success && result.txHash) {
          onSuccess({ txHash: result.txHash });
        } else {
          onError(new Error('Transaction failed'));
        }
      } catch (error) {
        onError(error);
      }
    }
  };

  return (
    <>
      {!paymentToken || chainId === paymentToken.chainId ? (
        <CustomLoadingButton
          title={buttonText}
          loading={paymentTxStatus.isPending}
          disabled={disabled || !ready}
          status={paymentTxStatus.status}
          onClick={handleClick}
        />
      ) : (
        <LoadingSwitchChainButton chainId={paymentToken.chainId} />
      )}

      <ConnectSignerDialog
        open={openConnectSignerDrawer}
        onClose={() => setOpenConnectSignerDrawer(false)}
        senderFlow={senderFlow}
      />
    </>
  );
};
