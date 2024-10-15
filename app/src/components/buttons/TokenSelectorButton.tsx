import { Chip, ChipProps } from '@mui/material';
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
} & Omit<ChipProps, 'onClick'>) {
  const [openSelectToken, setOpenSelectToken] = useState(false);
  const [tokenAnchorEl, setTokenAnchorEl] = useState<null | HTMLElement>(null);

  return (
    selectedToken && (
      <>
        <Chip
          {...props}
          label={selectedToken.id}
          avatar={<TokenAvatar token={selectedToken} sx={{ width: 24, height: 24 }} />}
          onClick={(event) => {
            setTokenAnchorEl(event.currentTarget);
            setOpenSelectToken(true);
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
