import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { FlowType, FlowWalletType } from '@payflow/common';
import { SelectedIdentityType } from '@payflow/common';
import { Address, isAddress } from 'viem';
import { SUPPORTED_CHAINS, isSupportedChain } from '../networks';
import { PaymentType } from '@payflow/common';
import { PaymentOption } from '@paywithglide/glide-js';

export function useCompatibleWallets({
  sender,
  recipient,
  payment,
  paymentOptions
}: {
  sender?: Address | FlowType;
  recipient?: SelectedIdentityType;
  payment?: PaymentType;
  paymentOptions?: PaymentOption[];
}) {
  return useMemo(() => {
    let compatibleSenderWallets: FlowWalletType[] = [];

    if (!sender) {
      return compatibleSenderWallets;
    }

    if (paymentOptions && sender) {
      return (sender as FlowType).wallets.filter((w) =>
        paymentOptions.find((o) => o.paymentCurrency.startsWith(`eip155:${w.network}`))
      );
    }

    if (!recipient) {
      return compatibleSenderWallets;
    }

    if (isAddress(sender as Address)) {
      compatibleSenderWallets =
        recipient.type === 'address' || !recipient.identity.profile?.defaultFlow
          ? SUPPORTED_CHAINS.map(
              (c) => ({ address: sender as Address, network: c.id }) as FlowWalletType
            )
          : (recipient.identity.profile?.defaultFlow?.wallets.map(
              (wallet) =>
                ({ address: sender as Address, network: wallet.network }) as FlowWalletType
            ) ?? []);
    } else {
      // in case a new wallet chain added, not all users maybe be compatible, limit by chains recipient supports
      // if default flow available otherwise fallback to identity
      compatibleSenderWallets =
        recipient.type === 'profile' && recipient.identity.profile?.defaultFlow
          ? (sender as FlowType).wallets.filter((w) =>
              recipient.identity.profile?.defaultFlow?.wallets.find(
                (rw) => rw.network === w.network
              )
            )
          : (sender as FlowType).wallets;

      if (compatibleSenderWallets.length === 0) {
        toast.error(
          'Current payment flow is not compatible with recipient, select a different flow!'
        );
      }
    }

    // filter by passed chainId if available and ensure only supported chains
    return compatibleSenderWallets.filter(
      (w) =>
        isSupportedChain(w.network) && (payment?.chainId ? w.network === payment.chainId : true)
    );
  }, [sender, recipient, paymentOptions]);
}

export function useToAddress({
  payment,
  recipient,
  chainId
}: {
  payment?: PaymentType;
  recipient: SelectedIdentityType;
  chainId?: number;
}) {
  return useMemo(() => {
    if (!chainId) {
      return;
    }
    if (payment?.receiverAddress) {
      return payment.receiverAddress;
    }

    if (recipient.type === 'address' || !recipient.identity.profile?.defaultFlow) {
      return recipient.identity.address;
    } else {
      return recipient.identity.profile?.defaultFlow?.wallets.find((w) => w.network === chainId)
        ?.address;
    }
  }, [chainId, recipient, payment]);
}
