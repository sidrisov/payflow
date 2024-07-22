import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { SelectedIdentityType } from '../../types/ProfleType';
import { Address, isAddress } from 'viem';
import { SUPPORTED_CHAINS } from '../networks';
import { PaymentType } from '../../types/PaymentType';

export function useCompatibleWallets({
  sender,
  recipient,
  payment
}: {
  sender: Address | FlowType;
  recipient: SelectedIdentityType;
  payment?: PaymentType;
}) {
  return useMemo(() => {
    let compatibleSenderWallets: FlowWalletType[] = [];

    if (sender) {
      if (isAddress(sender as Address)) {
        compatibleSenderWallets =
          recipient.type === 'address' || !recipient.identity.profile?.defaultFlow
            ? SUPPORTED_CHAINS.map(
                (c) => ({ address: sender as Address, network: c.id } as FlowWalletType)
              )
            : recipient.identity.profile?.defaultFlow?.wallets.map(
                (wallet) =>
                  ({ address: sender as Address, network: wallet.network } as FlowWalletType)
              ) ?? [];
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
    }

    // filter by passed chainId if available
    return compatibleSenderWallets.filter((w) =>
      payment?.chainId ? w.network === payment.chainId : true
    );
  }, [sender, recipient]);
}

export function useToAddress({
  recipient,
  selectedWallet
}: {
  recipient: SelectedIdentityType;
  selectedWallet?: FlowWalletType;
}) {
  return useMemo(() => {
    if (!selectedWallet) {
      return;
    }

    if (recipient.type === 'address' || !recipient.identity.profile?.defaultFlow) {
      return recipient.identity.address;
    } else {
      return recipient.identity.profile?.defaultFlow?.wallets.find(
        (w) => w.network === selectedWallet.network
      )?.address;
    }
  }, [selectedWallet?.network]);
}
