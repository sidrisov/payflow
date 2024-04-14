import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useMemo, useState } from 'react';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { Chain } from 'viem';
import { base, degen, optimism } from 'viem/chains';
import { ChooseChainMenu } from '../menu/ChooseChainMenu';
import { TokenSelectorButton } from '../buttons/TokenSelectorButton';
import { DEGEN_TOKEN, Token, getSupportedTokens } from '../../utils/erc20contracts';
import { getNetworkShortName } from '../../utils/networks';

export default function PaymentCastActionDialog(props: DialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openSelectChain, setOpenSelectChain] = useState<boolean>(false);
  const [chainAnchorEl, setChainAnchorEl] = useState<null | HTMLElement>(null);

  const [amount, setAmount] = useState<number | undefined>(0.99);
  const [token, setToken] = useState<Token | undefined>({ name: DEGEN_TOKEN } as Token);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [chain, setChain] = useState<Chain>(base);

  useMemo(async () => {
    const supportedTokens = getSupportedTokens(chain.id);
    setTokens(supportedTokens);
    setToken(supportedTokens[0]);
  }, [chain]);

  return (
    <Dialog
      fullScreen={isMobile}
      {...props}
      PaperProps={{
        sx: {
          ...(!isMobile && {
            borderRadius: 5
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            Payment Intent Action
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack my={3} p={1} direction="column" spacing={3} width="100%">
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
              onClick={(event) => {
                setChainAnchorEl(event.currentTarget);
                setOpenSelectChain(true);
              }}>
              <NetworkAvatar tooltip chainId={chain.id} sx={{ width: 28, height: 28 }} />
            </IconButton>
            <Typography fontSize={16} fontWeight="bold">
              {chain.name} Chain
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TokenSelectorButton
              selectedToken={token}
              setSelectedToken={setToken}
              tokens={tokens}
            />
            <Typography fontSize={16} fontWeight="bold">
              {token?.name} Token
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography fontSize={16} fontWeight="bold">
              Amount:
            </Typography>
            <TextField
              variant="standard"
              type="number"
              value={amount}
              inputProps={{
                style: {
                  maxWidth: 100,
                  textAlign: 'start',
                  fontWeight: 'bold',
                  fontSize: 18
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography ml={1.5} fontSize={18} fontWeight="bold">
                      $
                    </Typography>
                  </InputAdornment>
                ),
                inputMode: 'decimal',
                disableUnderline: true
              }}
              onChange={async (event) => {
                if (event.target.value) {
                  const amountUSD = parseFloat(event.target.value);
                  setAmount(amountUSD);
                } else {
                  setAmount(undefined);
                }
              }}
            />
          </Stack>
        </Stack>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          sx={{ borderRadius: 5 }}
          href={`https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fpay%2Fintent%3Famount%3D${amount}%26token%3D${token?.name.toLocaleLowerCase()}%26chain%3D${getNetworkShortName(
            chain.id
          )}`}
          target="_blank">
          Install Action
        </Button>
      </DialogContent>
      <ChooseChainMenu
        anchorEl={chainAnchorEl}
        open={openSelectChain}
        closeStateCallback={() => {
          setOpenSelectChain(false);
        }}
        chains={[base, optimism, degen]}
        selectedChain={chain}
        setSelectedChain={setChain}
      />
    </Dialog>
  );
}
