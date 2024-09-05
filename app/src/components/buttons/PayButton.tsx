import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { CustomLoadingButton } from './LoadingPaymentButton';
import { LoadingSwitchChainButton } from './LoadingSwitchNetworkButton';
import { Token } from '../../utils/erc20contracts';
import { FlowType } from '../../types/FlowType';
import { ConnectSignerDialog } from '../dialogs/ConnectSignerDialog';

type PayButtonProps = {
  paymentToken: Token | undefined;
  buttonText: string;
  isLoading: boolean;
  disabled: boolean;
  status: string;
  onClick: () => void;
  senderFlow: FlowType;
};

export const PayButton: React.FC<PayButtonProps> = ({
  paymentToken,
  buttonText,
  isLoading,
  disabled,
  status,
  onClick,
  senderFlow
}) => {
  const chainId = useChainId();
  const { address } = useAccount();
  const [openConnectSignerDrawer, setOpenConnectSignerDrawer] = useState(false);

  const handleClick = () => {
    if (address?.toLowerCase() !== senderFlow.signer.toLowerCase()) {
      setOpenConnectSignerDrawer(true);
    } else {
      onClick();
    }
  };

  return (
    <>
      {!paymentToken || chainId === paymentToken.chainId ? (
        <CustomLoadingButton
          title={buttonText}
          loading={isLoading}
          disabled={disabled}
          status={status}
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
