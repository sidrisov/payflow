import { Chip, ChipProps } from '@mui/material';
import { FlowWalletType } from '../../types/FlowType';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { useState } from 'react';
import { ChooseWalletMenu } from '../menu/ChooseWalletMenu';
import { getNetworkDisplayName } from '../../utils/networks';

export function NetworkSelectorButton({
  wallets,
  selectedWallet,
  setSelectedWallet,
  ...props
}: {
  wallets: FlowWalletType[];
  selectedWallet: FlowWalletType | undefined;
  setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
} & Omit<ChipProps, 'onClick'>) {
  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  return (
    selectedWallet && (
      <>
        <Chip
          {...props}
          label={getNetworkDisplayName(selectedWallet.network)}
          avatar={<NetworkAvatar chainId={selectedWallet.network} sx={{ width: 24, height: 24 }} />}
          onClick={(event) => {
            setWalletAnchorEl(event.currentTarget);
            setOpenSelectWallet(true);
          }}
          variant="outlined"
          sx={{
            p: 0.1,
            width: 110,
            justifyContent: 'flex-start',
            fontSize: 16,
            textTransform: 'uppercase'
          }}
        />
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
