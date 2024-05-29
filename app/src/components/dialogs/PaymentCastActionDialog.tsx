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
import { arbitrum, base, degen, mode, optimism } from 'viem/chains';
import { ChooseChainMenu } from '../menu/ChooseChainMenu';
import { TokenSelectorButton } from '../buttons/TokenSelectorButton';
import { Token, getSupportedTokens } from '../../utils/erc20contracts';
import { getNetworkShortName } from '../../utils/networks';
import { ArrowBack, SwapVert } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { grey } from '@mui/material/colors';
import { PaymentCastActionAdvancedSection } from '../PaymentCastActionAdvancedSection';
import { type } from '../../types/PaymentType';

export default function PaymentCastActionDialog({
  closeStateCallback,
  ...props
}: DialogProps & CloseCallbackType) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openSelectChain, setOpenSelectChain] = useState<boolean>(false);
  const [chainAnchorEl, setChainAnchorEl] = useState<null | HTMLElement>(null);

  const [usdAmount, setUsdAmount] = useState<number | undefined>(0.99);
  const [tokenAmount, setTokenAmount] = useState<number | undefined>(1);
  const [token, setToken] = useState<Token | undefined>();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [chain, setChain] = useState<Chain>(base);
  const [type, setType] = useState<type>('INTENT');

  const [usdAmountMode, setUsdAmountMode] = useState<boolean>(true);

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
          }),
          minWidth: 350
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        {isMobile && (
          <IconButton onClick={closeStateCallback}>
            <ArrowBack />
          </IconButton>
        )}
        <Box display="flex" justifyContent="center">
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            Payment Intent Action
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-start'
        }}>
        <Stack my={3} p={1} direction="column" spacing={3} width="100%">
          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              variant="standard"
              type="number"
              value={usdAmountMode ? usdAmount : tokenAmount}
              inputProps={{
                style: {
                  fontWeight: 'bold',
                  fontSize: 25,
                  alignSelf: 'center',
                  textAlign: 'center'
                }
              }}
              InputProps={{
                ...(usdAmountMode
                  ? {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography fontSize={18} fontWeight="bold">
                            $
                          </Typography>
                        </InputAdornment>
                      )
                    }
                  : {
                      endAdornment: (
                        <InputAdornment position="start">
                          <Typography fontSize={18} fontWeight="bold">
                            {token?.name}
                          </Typography>
                        </InputAdornment>
                      )
                    }),
                inputMode: 'decimal',
                disableUnderline: true
              }}
              onChange={async (event) => {
                if (event.target.value) {
                  const amount = parseFloat(event.target.value);
                  if (usdAmountMode) {
                    setUsdAmount(amount);
                  } else {
                    setTokenAmount(amount);
                  }
                } else {
                  setUsdAmount(undefined);
                  setTokenAmount(undefined);
                }
              }}
              sx={{ width: 200, border: 1, borderRadius: 10, borderColor: 'divider', px: 2 }}
            />
            <IconButton
              size="small"
              sx={{ color: grey[400] }}
              onClick={async () => {
                setUsdAmountMode(!usdAmountMode);
              }}>
              <SwapVert fontSize="small" />
            </IconButton>
          </Stack>
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
          <PaymentCastActionAdvancedSection type={type} setType={setType} />
        </Stack>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          size="large"
          sx={{ borderRadius: 5 }}
          href={`https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fpay%2Fintent%3Famount%3D${
            usdAmountMode ? usdAmount ?? '' : ''
          }%26tokenAmount%3D${!usdAmountMode ? tokenAmount ?? '' : ''}%26token%3D${
            token?.id
          }%26chain%3D${getNetworkShortName(chain.id)}%26type%3D${type ?? 'INTENT'}`}
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
        chains={[base, optimism, mode, degen, arbitrum]}
        selectedChain={chain}
        setSelectedChain={setChain}
      />
    </Dialog>
  );
}
