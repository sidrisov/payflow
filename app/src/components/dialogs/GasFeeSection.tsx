import { Typography, Tooltip, Box } from '@mui/material';
import { green } from '@mui/material/colors';
import { getGasFeeText } from '../../types/gas';
import { Token } from '../../utils/erc20contracts';
import { useTokenPrices } from '../../utils/queries/prices';

export function GasFeeSection({
  selectedToken,
  gasFee
}: {
  selectedToken: Token | undefined;
  gasFee: bigint | undefined;
}) {
  // keep for future reference, in case erc20 used for gas payment
  console.log(selectedToken);
  const { data: tokenPrices } = useTokenPrices();
  return (
    <Tooltip
      title="Gas is paid by the sending flow wallet via Gelato SyncFee call method. 
                    The fee includes Gelato on-chain call, safe tx fee + deployment fee on the first tx, and 10% Gelato's comission on top of all.">
      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption">Gas Fee</Typography>
        <Typography variant="caption" color={gasFee === BigInt(0) ? green.A700 : 'inherit'}>
          {getGasFeeText(gasFee, tokenPrices?.[selectedToken?.id as string])}
        </Typography>
      </Box>
    </Tooltip>
  );
}
