import { Stack } from '@mui/material';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Id, toast } from 'react-toastify';

import { Address, erc20Abi } from 'viem';

import { FlowWalletType } from '../../types/FlowType';
import { IdentityType } from '../../types/ProfleType';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { SUPPORTED_CHAINS } from '../../utils/networks';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { ETH_TOKEN, Token, getSupportedTokens } from '../../utils/erc20contracts';
import { RecipientField } from '../RecipientField';
import { TokenAmountSection } from './TokenAmountSection';

export default function PayProfileDialog({ sender, recipient }: PaymentDialogProps) {
  const { chain } = useAccount();

  const [compatibleWallets, setCompatibleWallets] = useState<FlowWalletType[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();

  const [compatibleTokens, setCompatibleTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token>();

  const [toAddress, setToAddress] = useState<Address>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number>();
  const [sendAmount, setSendAmount] = useState<bigint>();

  const sendToastId = useRef<Id>();

  const { loading, confirmed, error, status, txHash, sendTransaction, writeContract, reset } =
    useRegularTransfer();

  useEffect(() => {
    if (!recipient || !(sender as Address)) {
      setSelectedWallet(undefined);
      setCompatibleWallets([]);
      return;
    }

    const compatibleSenderWallets =
      recipient.type === 'address'
        ? SUPPORTED_CHAINS.map(
            (c) => ({ address: sender as Address, network: c.id } as FlowWalletType)
          )
        : recipient.identity.profile?.defaultFlow?.wallets.map(
            (wallet) => ({ address: sender as Address, network: wallet.network } as FlowWalletType)
          ) ?? [];

    setCompatibleWallets(compatibleSenderWallets);

    console.debug('compatible sender wallets: ', compatibleSenderWallets);

    if (compatibleSenderWallets.length === 0) {
      toast.error('No compatible wallets available!');
      return;
    }
  }, [sender]);

  useEffect(() => {
    const wallet =
      (chain && compatibleWallets.find((w) => w.network === chain.id)) ?? compatibleWallets[0];
    setSelectedWallet(wallet);
    console.debug('selected sender wallet: ', wallet);
  }, [compatibleWallets, chain]);

  useEffect(() => {
    setSelectedToken(compatibleTokens[0]);
  }, [compatibleTokens, chain]);

  useMemo(() => {
    if (!recipient || !selectedWallet) {
      setToAddress(undefined);
      return;
    }

    if (recipient.type === 'address') {
      setToAddress(recipient.identity.address);
    } else {
      setToAddress(
        recipient.identity.profile?.defaultFlow?.wallets.find(
          (w) => w.network === selectedWallet.network
        )?.address
      );
    }

    const tokens = getSupportedTokens(selectedWallet.network);
    setCompatibleTokens(tokens);
  }, [selectedWallet]);

  useMemo(async () => {
    if (!sendAmount || !recipient || !selectedWallet) {
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
  }, [loading, confirmed, error, txHash, sendAmount, recipient]);

  useMemo(async () => {
    if (status === 'rejected') {
      toast.error('Cancelled', { closeButton: false, autoClose: 5000 });
    }
  }, [status]);

  return (
    <>
      <Stack width="100%" spacing={2} alignItems="center">
        <RecipientField recipient={recipient} />
        {recipient && selectedWallet && selectedToken && (
          <TokenAmountSection
            selectedWallet={selectedWallet}
            setSelectedWallet={setSelectedWallet}
            compatibleWallets={compatibleWallets}
            compatibleTokens={compatibleTokens}
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            sendAmount={sendAmount}
            setSendAmount={setSendAmount}
            sendAmountUSD={sendAmountUSD}
            setSendAmountUSD={setSendAmountUSD}
          />
        )}
      </Stack>
      {recipient &&
        selectedWallet &&
        (chain?.id === selectedWallet.network ? (
          <LoadingPaymentButton
            title="Pay"
            status={status}
            loading={loading || (txHash && !confirmed && !error)}
            disabled={!(toAddress && sendAmount)}
            onClick={() => {
              if (!toAddress || !sendAmount || !selectedToken || !selectedToken) {
                return;
              }

              if (selectedToken.name === ETH_TOKEN) {
                sendTransaction?.({ to: toAddress, value: sendAmount });
              } else {
                writeContract?.({
                  abi: erc20Abi,
                  address: selectedToken.address,
                  functionName: 'transfer',
                  args: [toAddress, sendAmount]
                });
              }
            }}
          />
        ) : (
          <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
        ))}
    </>
  );
}

/* <Tooltip title="Add a note">
                <IconButton
                  size="small"
                  color="inherit"
                  sx={{ mr: 0.5, alignSelf: 'flex-end' }}
                  onClick={() => {
                    comingSoonToast();
                  }}>
                  <AddComment fontSize="small" />
                </IconButton>
              </Tooltip> */
