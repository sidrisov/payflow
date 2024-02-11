import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { SelectedIdentityType } from '../../types/ProfleType';
import { Address, isAddress } from 'viem';
import { SUPPORTED_CHAINS } from '../networks';

export function useCompatibleWallets({
  sender,
  recipient
}: {
  sender: Address | FlowType;
  recipient: SelectedIdentityType;
}) {
  return useMemo(() => {
    let compatibleSenderWallets;

    if (isAddress(sender as Address)) {
      compatibleSenderWallets =
        recipient.type === 'address'
          ? SUPPORTED_CHAINS.map(
              (c) => ({ address: sender as Address, network: c.id } as FlowWalletType)
            )
          : recipient.identity.profile?.defaultFlow?.wallets.map(
              (wallet) =>
                ({ address: sender as Address, network: wallet.network } as FlowWalletType)
            ) ?? [];
    } else {
      // in case a new wallet chain added, not all users maybe be compatible, limit by chains recipient supports
      compatibleSenderWallets =
        recipient.type === 'profile'
          ? (sender as FlowType).wallets.filter((w) =>
              recipient.identity.profile?.defaultFlow?.wallets.find(
                (rw) => rw.network === w.network
              )
            )
          : (sender as FlowType).wallets;

      if (compatibleSenderWallets.length === 0) {
        toast.error('No compatible wallets available!');
      }
    }
    return compatibleSenderWallets;
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

    if (recipient.type === 'address') {
      return recipient.identity.address;
    } else {
      return recipient.identity.profile?.defaultFlow?.wallets.find(
        (w) => w.network === selectedWallet.network
      )?.address;
    }
  }, [selectedWallet?.network]);
}
