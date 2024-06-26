import { ExpandLess, ExpandMore, Token as NetworkToken } from '@mui/icons-material';
import { Stack, Box, Chip, Typography, IconButton } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { formatUnits } from 'viem';
import { useBalance, useChainId } from 'wagmi';
import { FlowWalletType } from '../types/FlowType';
import { Token, getSupportedTokens } from '../utils/erc20contracts';
import { getNetworkDisplayName } from '../utils/networks';
import { normalizeNumberPrecision } from '../utils/formats';
import { useTokenPrices } from '../utils/queries/prices';
import { NetworkSelectorButton } from './buttons/NetworkSelectorButton';
import { TokenSelectorButton } from './buttons/TokenSelectorButton';
import { GasFeeSection } from './dialogs/GasFeeSection';
import { PaymentType } from '../types/PaymentType';

export function NetworkTokenSelector({
  payment,
  selectedWallet,
  setSelectedWallet,
  compatibleWallets,
  selectedToken,
  setSelectedToken,
  enabledChainCurrencies,
  gasFee
}: {
  payment?: PaymentType;
  selectedWallet: FlowWalletType | undefined;
  setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
  compatibleWallets: FlowWalletType[];
  selectedToken?: Token;
  setSelectedToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  enabledChainCurrencies?: string[];
  gasFee?: bigint;
}) {
  const chainId = useChainId();

  const [expand, setExpand] = useState<boolean>(false);
  const [compatibleTokens, setCompatibleTokens] = useState<Token[]>([]);

  const [maxBalance, setMaxBalance] = useState<string>('0.0');
  const [maxBalanceUsd, setMaxBalanceUsd] = useState<string>('0.0');

  const { data: tokenPrices } = useTokenPrices();

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId,
    token: selectedToken?.tokenAddress,
    query: {
      enabled: selectedWallet !== undefined && selectedToken !== undefined,
      gcTime: 5000
    }
  });

  useMemo(async () => {
    const selectedTokenPrice = selectedToken && tokenPrices?.[selectedToken.id];
    if (selectedTokenPrice) {
      const maxBalance =
        isSuccess && balance ? parseFloat(formatUnits(balance.value, balance.decimals)) : 0;

      const maxBalanceUsd =
        isSuccess && balance
          ? parseFloat(formatUnits(balance.value, balance.decimals)) * selectedTokenPrice
          : 0;

      setMaxBalance(normalizeNumberPrecision(maxBalance));
      setMaxBalanceUsd(normalizeNumberPrecision(maxBalanceUsd));
    }
  }, [isSuccess, balance, tokenPrices]);

  useEffect(() => {
    // don't update if selected token was already selected
    if (selectedToken && compatibleTokens.find((t) => t === selectedToken)) {
      return;
    }

    setSelectedToken(compatibleTokens[0]);
  }, [selectedToken, compatibleTokens, chainId]);

  useMemo(() => {
    if (!selectedWallet) {
      return;
    }
    // filter by passed token if available
    const tokens = getSupportedTokens(selectedWallet.network).filter((t) =>
      !payment?.receiverFid && payment?.token ? t.id === payment?.token : true
    );

    setCompatibleTokens(
      enabledChainCurrencies
        ? tokens.filter((t) =>
            enabledChainCurrencies.find(
              (c) =>
                c ===
                `eip155:${selectedWallet.network}/${
                  t.tokenAddress ? `erc20:${t.tokenAddress}` : `slip44:60`
                }`
            )
          )
        : tokens
    );
  }, [selectedWallet]);

  return (
    <Stack width="100%">
      <Box
        px={1}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center">
        <Chip
          icon={<NetworkToken fontSize="small" />}
          label="Network & Token"
          variant="outlined"
          sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
        />
        {selectedWallet ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="subtitle2">
              {getNetworkDisplayName(selectedWallet.network)} / {selectedToken?.name}
            </Typography>
            <IconButton size="small" onClick={() => setExpand(!expand)}>
              {expand ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Stack>
        ) : (
          <Typography variant="subtitle2">...</Typography>
        )}
      </Box>

      {expand && selectedWallet && compatibleTokens && (
        <>
          <Box
            py={1}
            px={2}
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            justifyContent="flex-start"
            gap={0.5}
            sx={{ borderRadius: 5, border: 1, borderColor: 'divider' }}>
            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption">Network</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">
                  {getNetworkDisplayName(selectedWallet.network)}
                </Typography>
                <NetworkSelectorButton
                  selectedWallet={selectedWallet}
                  setSelectedWallet={setSelectedWallet}
                  wallets={compatibleWallets}
                />
              </Stack>
            </Box>

            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption">Token</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">{selectedToken?.name}</Typography>
                <TokenSelectorButton
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  tokens={compatibleTokens}
                />
              </Stack>
            </Box>

            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption">Available</Typography>
              <Typography variant="caption">
                {`${maxBalance} ${selectedToken?.name} ≈ $${maxBalanceUsd}`}
              </Typography>
            </Box>
            {gasFee !== undefined && (
              <GasFeeSection selectedToken={selectedToken} gasFee={gasFee} />
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
