import { Typography, Stack, Tooltip } from '@mui/material';
import { useContext } from 'react';
import { LocalGasStation } from '@mui/icons-material';
import { ProfileContext } from '../../contexts/UserContext';
import { green } from '@mui/material/colors';
import { getGasFeeText } from '../../types/gas';
import { ETH_TOKEN, Token } from '../../utils/erc20contracts';

export function GasFeeSection({
  selectedToken,
  gasFee
}: {
  selectedToken: Token | undefined;
  gasFee: bigint | undefined;
}) {
  // keep for future reference, in case erc20 used for gas payment
  console.log(selectedToken);
  const { tokenPrices } = useContext(ProfileContext);
  return (
    <Stack pl={0.5} direction="row" spacing={0.5} alignItems="center">
      <Tooltip
        title="Gas is paid by the sending flow wallet via Gelato SyncFee call method. 
                    The fee includes Gelato on-chain call, safe tx fee + deployment fee on the first tx, and 10% Gelato's comission on top of all.">
        <LocalGasStation fontSize="small" />
      </Tooltip>
      <Typography ml={1} variant="caption" color={gasFee === BigInt(0) ? green.A700 : 'inherit'}>
        {getGasFeeText(gasFee, tokenPrices?.[ETH_TOKEN])}
      </Typography>
    </Stack>
  );
}
