import { Typography, Tooltip, Box } from '@mui/material';
import { green } from '@mui/material/colors';
import { getFeeText } from '../../types/gas';
import { Token } from '../../utils/erc20contracts';
import { useTokenPrices } from '../../utils/queries/prices';

export function FeeSection({
  type,
  tooltip,
  title,
  token,
  fee
}: {
  type: 'gas' | 'cross-chain';
  tooltip: string;
  title: string;
  token: Token | undefined;
  fee: bigint | undefined;
}) {
  const { data: tokenPrices } = useTokenPrices();
  return (
    <Tooltip title={tooltip}>
      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" fontWeight={500}>
          {title}
        </Typography>
        <Typography
          variant="caption"
          fontWeight="bold"
          color={fee === BigInt(0) ? green.A700 : 'inherit'}>
          {getFeeText(type, fee, tokenPrices?.[token?.id as string])}
        </Typography>
      </Box>
    </Tooltip>
  );
}
