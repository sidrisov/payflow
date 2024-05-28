import { IconButton, IconButtonProps } from '@mui/material';
import { useState } from 'react';
import { Token } from '../../utils/erc20contracts';
import TokenAvatar from '../avatars/TokenAvatar';
import { ChooseTokenMenu } from '../menu/ChooseTokeMenu';

export function TokenSelectorButton({
  tokens,
  selectedToken,
  setSelectedToken,
  ...props
}: {
  tokens: Token[];
  selectedToken: Token | undefined;
  setSelectedToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
} & IconButtonProps) {
  const [openSelectToken, setOpenSelectToken] = useState(false);
  const [tokenAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  return (
    selectedToken && (
      <>
        <IconButton
          {...props}
          sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
          onClick={(event) => {
            setWalletAnchorEl(event.currentTarget);
            setOpenSelectToken(true);
          }}>
          <TokenAvatar token={selectedToken} sx={{ width: 28, height: 28 }} />
        </IconButton>
        <ChooseTokenMenu
          anchorEl={tokenAnchorEl}
          open={openSelectToken}
          closeStateCallback={() => {
            setOpenSelectToken(false);
          }}
          tokens={tokens}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
      </>
    )
  );
}
