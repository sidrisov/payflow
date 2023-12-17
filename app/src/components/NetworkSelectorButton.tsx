import { IconButton, IconButtonProps } from '@mui/material';
import { FlowWalletType } from '../types/FlowType';
import NetworkAvatar from './NetworkAvatar';
import { useState } from 'react';
import { ChooseWalletMenu } from './ChooseWalletMenu';

export function NetworkSelectorButton({
  wallets,
  selectedWallet,
  setSelectedWallet,
  ...props
}: {
  wallets: FlowWalletType[];
  selectedWallet: FlowWalletType | undefined;
  setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
} & IconButtonProps) {
  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  return (
    selectedWallet && (
      <>
        <IconButton
          {...props}
          sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
          onClick={(event) => {
            setWalletAnchorEl(event.currentTarget);
            setOpenSelectWallet(true);
          }}>
          <NetworkAvatar tooltip network={selectedWallet.network} sx={{ width: 28, height: 28 }} />
        </IconButton>
        <ChooseWalletMenu
          anchorEl={walletAnchorEl}
          open={openSelectWallet}
          closeStateCallback={() => {
            setOpenSelectWallet(false);
          }}
          wallets={wallets}
          selectedWallet={selectedWallet}
          setSelectedWallet={setSelectedWallet}
        />
      </>
    )
  );
}
