import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { CustomLoadingButton } from './LoadingPaymentButton';
import { LoadingSwitchChainButton } from './LoadingSwitchNetworkButton';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { SwitchFlowSignerSection } from '../dialogs/SwitchFlowSignerSection';
import { useMediaQuery } from '@mui/material';

type PayButtonProps = {
  paymentToken: any;
  buttonText: string;
  isLoading: boolean;
  disabled: boolean;
  status: string;
  onClick: () => void;
  senderFlow: any;
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
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

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

      {address?.toLowerCase() !== senderFlow.signer.toLowerCase() && (
        <ResponsiveDialog
          title="Connect Signer"
          open={openConnectSignerDrawer}
          onOpen={() => setOpenConnectSignerDrawer(true)}
          onClose={() => setOpenConnectSignerDrawer(false)}>
          <Stack alignItems="flex-start" spacing={2}>
            <Typography variant="caption" color={grey[prefersDarkMode ? 400 : 700]}>
              Selected payment flow `<b>{senderFlow.title}</b>` signer is not connected! Please,
              proceed with connecting the signer mentioned below:
            </Typography>
            <SwitchFlowSignerSection
              onSwitch={() => setOpenConnectSignerDrawer(false)}
              flow={senderFlow}
            />
          </Stack>
        </ResponsiveDialog>
      )}
    </>
  );
};
