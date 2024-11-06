import { Box, Typography, CircularProgress, Badge } from '@mui/material';
import { useState, useMemo, useEffect, useContext } from 'react';
import { formatUnits } from 'viem';
import { FlowWalletType } from '../types/FlowType';
import { Token, getSupportedTokensByChainIds } from '../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import { PaymentType } from '../types/PaymentType';
import { degen } from 'viem/chains';
import { useAssetBalances } from '../utils/queries/balances';
import { getFlowWalletsAssets } from '../utils/assets';
import ResponsiveDialog from './dialogs/ResponsiveDialog';
import NetworkAvatar from './avatars/NetworkAvatar';
import TokenAvatar from './avatars/TokenAvatar';
import { Chip } from '@mui/material';
import { IoIosArrowDown } from 'react-icons/io';
import {
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Divider
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { green } from '@mui/material/colors';
import { FaCheckCircle } from 'react-icons/fa';
import { ProfileContext } from '../contexts/UserContext';
import { SUPPORTED_CHAINS } from '../utils/networks';

export function NetworkTokenSelector({
  payment,
  crossChainMode = false,
  compatibleWallets,
  paymentToken,
  setPaymentToken,
  enabledChainCurrencies,
  showBalance = true,
  expandSection = false
}: {
  payment?: PaymentType;
  crossChainMode?: boolean;
  compatibleWallets: FlowWalletType[];
  paymentToken?: Token;
  setPaymentToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  enabledChainCurrencies?: string[];
  showBalance?: boolean;
  expandSection?: boolean;
}) {
  const { profile } = useContext(ProfileContext);

  const [expand, setExpand] = useState<boolean>(expandSection);

  const { isFetched: isBalanceFetched, data: balances } = useAssetBalances(
    showBalance && compatibleWallets ? getFlowWalletsAssets(compatibleWallets) : []
  );

  const compatibleTokens = useMemo(() => {
    if (!compatibleWallets) {
      return [];
    }
    // filter by passed token if available
    const tokens = getSupportedTokensByChainIds(compatibleWallets.map((w) => w.network)).filter(
      (t) => (!crossChainMode && payment?.token ? t.id === payment?.token : true)
    );

    const compatibleTokens = enabledChainCurrencies
      ? tokens.filter((t) =>
          enabledChainCurrencies.find(
            (c) =>
              c ===
              `eip155:${t.chainId}/${
                t.tokenAddress
                  ? `erc20:${t.tokenAddress}`
                  : t.chainId === degen.id
                  ? 'slip44:33436'
                  : 'slip44:60'
              }`
          )
        )
      : tokens;

    // return at least 1
    return !showBalance || payment?.token || crossChainMode
      ? compatibleTokens
      : (function () {
          // Sort tokens by USD value
          const sortedTokens = compatibleTokens.sort((a, b) => {
            const aBalance = balances?.find((balance) => balance.asset.token === a);
            const bBalance = balances?.find((balance) => balance.asset.token === b);
            return (bBalance?.usdValue ?? 0) - (aBalance?.usdValue ?? 0);
          });

          // If no tokens are found with a balance > 0, select at least the first token
          return sortedTokens.length > 0 ? sortedTokens : [compatibleTokens[0]];
        })();
  }, [crossChainMode, compatibleWallets, enabledChainCurrencies, balances]);

  const selectedTokenBalance = useMemo(() => {
    if (showBalance) {
      if (isBalanceFetched && balances) {
        const paymentTokenBalance = balances.find(
          (balance) => balance.asset.token === paymentToken
        );

        const maxBalance = paymentTokenBalance?.balance
          ? parseFloat(
              formatUnits(paymentTokenBalance.balance.value, paymentTokenBalance.balance.decimals)
            )
          : 0;

        return normalizeNumberPrecision(maxBalance);
      }
    }
  }, [isBalanceFetched, paymentToken, balances]);

  useEffect(() => {
    // don't update if selected token was already selected
    if (paymentToken && compatibleTokens.find((t) => t === paymentToken)) {
      return;
    }

    setPaymentToken(compatibleTokens[0]);
  }, [paymentToken, compatibleTokens]);

  console.log('Compatible tokens: ', compatibleTokens);
  console.log('Selected token: ', paymentToken);

  const label = `${crossChainMode ? 'Cross-Chain ' : ''}Payment Token`;

  const paymentTokenSelectable =
    (!payment?.token || crossChainMode) && paymentToken && (!showBalance || isBalanceFetched);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChainId, setSelectedChainId] = useState<number | 'all'>('all');

  const { preferredTokens, otherTokens, zeroBalanceTokens } = useMemo(() => {
    const preferred = new Set(profile?.preferredTokens || []);

    const filtered = compatibleTokens.filter((token) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (selectedChainId === 'all' || token.chainId === selectedChainId) &&
        (token.id.toLowerCase().includes(searchLower) ||
          token.name.toLowerCase().includes(searchLower))
      );
    });

    if (!balances) {
      return {
        preferredTokens: filtered.filter((token) => preferred.has(token.id)),
        otherTokens: filtered.filter((token) => !preferred.has(token.id)),
        zeroBalanceTokens: []
      };
    }

    const hasBalance = (token: Token) => {
      const balance = balances.find(
        (b) => b.asset.token.id === token.id && b.asset.chainId === token.chainId
      );
      return balance?.balance?.value && balance.balance.value > 0n;
    };

    const withBalance = filtered.filter(hasBalance);
    const withoutBalance = filtered.filter((token) => !hasBalance(token));

    return {
      preferredTokens: withBalance.filter((token) => preferred.has(token.id)),
      otherTokens: withBalance.filter((token) => !preferred.has(token.id)),
      zeroBalanceTokens: withoutBalance
    };
  }, [compatibleTokens, searchTerm, profile?.preferredTokens, balances, selectedChainId]);

  function renderTokenList(tokenList: Token[], title?: string) {
    return (
      <>
        {tokenList.length > 0 && title && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </MenuItem>
        )}
        {tokenList.map((token) => {
          const balance = balances?.find(
            (b) => b.asset.token.id === token.id && b.asset.chainId === token.chainId
          );

          return (
            <MenuItem
              key={token.chainId + '-' + token.id}
              onClick={() => {
                setPaymentToken(token);
                setExpand(false);
              }}
              sx={{ borderRadius: 5 }}>
              <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Box width={18} height={18} display="flex" alignItems="center">
                    {token.id === paymentToken?.id && token.chainId === paymentToken?.chainId && (
                      <FaCheckCircle color={green[500]} size={18} />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <NetworkAvatar chainId={token.chainId} sx={{ width: 16, height: 16 }} />
                      }>
                      <TokenAvatar token={token} sx={{ width: 30, height: 30 }} />
                    </Badge>
                    <Typography textTransform="uppercase">
                      {token.id}
                      {balance && balance.usdValue > 0 && (
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          display="block"
                          color="text.secondary">
                          {formatAmountWithSuffix(
                            normalizeNumberPrecision(
                              Number(formatUnits(balance.balance?.value ?? 0n, token.decimals))
                            )
                          )}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>
                {balance && balance.usdValue > 0 && (
                  <Typography variant="body1">
                    ${formatAmountWithSuffix(balance.usdValue.toFixed(1))}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          );
        })}
      </>
    );
  }

  // Get available networks from current filtered tokens
  const availableNetworks = useMemo(() => {
    const networksInSearch = compatibleTokens
      .filter((token) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          token.id.toLowerCase().includes(searchLower) ||
          token.name.toLowerCase().includes(searchLower)
        );
      })
      .map((t) => t.chainId);

    const uniqueNetworks = Array.from(new Set(networksInSearch));
    return uniqueNetworks.sort((a, b) => {
      const aIndex = SUPPORTED_CHAINS.findIndex((chain) => chain.id === a);
      const bIndex = SUPPORTED_CHAINS.findIndex((chain) => chain.id === b);
      return aIndex - bIndex;
    });
  }, [compatibleTokens, searchTerm]);

  // Update selected network if it becomes unavailable
  useEffect(() => {
    if (selectedChainId !== 'all' && !availableNetworks.includes(selectedChainId)) {
      setSelectedChainId('all');
    }
  }, [availableNetworks, selectedChainId]);

  return (
    <>
      <Chip
        icon={
          paymentToken && isBalanceFetched ? (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <NetworkAvatar chainId={paymentToken.chainId} sx={{ width: 12, height: 12 }} />
              }>
              <TokenAvatar token={paymentToken} sx={{ width: 24, height: 24 }} />
            </Badge>
          ) : (
            <CircularProgress size={20} />
          )
        }
        deleteIcon={<IoIosArrowDown />}
        onDelete={paymentTokenSelectable ? () => setExpand(true) : undefined}
        label={
          paymentToken && isBalanceFetched ? (
            <Typography variant="subtitle2" textTransform="uppercase">
              {showBalance ? formatAmountWithSuffix(selectedTokenBalance ?? '0') : ''}{' '}
              {paymentToken.id}
            </Typography>
          ) : (
            <Typography variant="subtitle2">Loading</Typography>
          )
        }
        onClick={paymentTokenSelectable ? () => setExpand(true) : undefined}
        variant="outlined"
        sx={{
          px: 0.5,
          height: 40,
          borderRadius: 5,
          gap: 0.5,
          '& .MuiChip-label': { px: 1 },
          ...(paymentTokenSelectable && {
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'action.hover' }
          })
        }}
      />

      {paymentToken && compatibleTokens && (
        <ResponsiveDialog
          open={expand}
          onClose={() => {
            setExpand(false);
            setSearchTerm('');
          }}
          title={label}
          zIndex={1450}>
          <Box width="100%" sx={{ px: 1 }}>
            <TextField
              margin="dense"
              size="small"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: { borderRadius: 4 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                        aria-label="clear search">
                        <ClearIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            {availableNetworks.length > 1 && (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  mt: 1,
                  pb: 1,
                  overflowX: 'auto',
                  '-webkit-overflow-scrolling': 'touch',
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none'
                }}>
                <Chip
                  label="All"
                  onClick={() => setSelectedChainId('all')}
                  variant={selectedChainId === 'all' ? 'filled' : 'outlined'}
                  sx={{ borderRadius: 5, border: 'none' }}
                />
                {availableNetworks.map((chainId) => (
                  <Chip
                    key={chainId}
                    avatar={<NetworkAvatar chainId={chainId} sx={{ width: 24, height: 24 }} />}
                    label={SUPPORTED_CHAINS?.find((c) => c.id === chainId)?.name}
                    onClick={() => setSelectedChainId(chainId)}
                    variant={selectedChainId === chainId ? 'filled' : 'outlined'}
                    sx={{ borderRadius: 4, border: 'none' }}
                  />
                ))}
              </Stack>
            )}
          </Box>
          <Stack
            width="100%"
            minHeight={350}
            maxHeight={450}
            sx={{
              overflowY: 'scroll',
              '-webkit-overflow-scrolling': 'touch'
            }}>
            <MenuList dense disablePadding>
              {renderTokenList(preferredTokens, 'Preferred Tokens')}
              {otherTokens.length > 0 && preferredTokens.length > 0 && (
                <Divider variant="middle" sx={{ my: 1 }} />
              )}
              {renderTokenList(otherTokens)}
              {balances && zeroBalanceTokens.length > 0 && (
                <>
                  {(preferredTokens.length > 0 || otherTokens.length > 0) && (
                    <Divider variant="middle" sx={{ my: 1 }} />
                  )}
                  {renderTokenList(zeroBalanceTokens, 'Zero Balance')}
                </>
              )}
              {preferredTokens.length === 0 &&
                otherTokens.length === 0 &&
                (!balances || zeroBalanceTokens.length === 0) && (
                  <MenuItem disabled>
                    <Typography color="text.secondary">No tokens found</Typography>
                  </MenuItem>
                )}
            </MenuList>
          </Stack>
        </ResponsiveDialog>
      )}
    </>
  );
}
