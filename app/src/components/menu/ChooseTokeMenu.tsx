import {
  Box,
  Divider,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { green } from '@mui/material/colors';
import { Token } from '../../utils/erc20contracts';
import TokenAvatar from '../avatars/TokenAvatar';
import { useState, useContext, useMemo } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { ProfileContext } from '../../contexts/UserContext';
import { AssetBalanceType } from '../../types/AssetType';
import { formatUnits } from 'viem';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';

export type ChooseTokenMenuProps = MenuProps &
  CloseCallbackType & {
    tokens: Token[];
    balances?: AssetBalanceType[];
    selectedToken: Token | undefined;
    setSelectedToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  };

export function ChooseTokenMenu({
  tokens,
  balances,
  selectedToken,
  setSelectedToken,
  closeStateCallback,
  ...props
}: ChooseTokenMenuProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useContext(ProfileContext);

  const { preferredTokens, otherTokens, zeroBalanceTokens } = useMemo(() => {
    const preferred = new Set(profile?.preferredTokens || []);

    const filtered = tokens.filter((token) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        token.id.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower) ||
        token.description?.toLowerCase().includes(searchLower)
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
  }, [tokens, searchTerm, profile?.preferredTokens, balances]);

  const renderTokenList = (tokenList: Token[], title?: string) => (
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
            key={token.id}
            onClick={async () => {
              setSelectedToken(token);
              closeStateCallback();
            }}>
            <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box width={18} height={18} display="flex" alignItems="center">
                  {token.id === selectedToken?.id && <FaCheckCircle color={green[500]} size={18} />}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <TokenAvatar token={token} sx={{ width: 30, height: 30 }} />
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
                  $
                  {balance.usdValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Typography>
              )}
            </Box>
          </MenuItem>
        );
      })}
    </>
  );

  return (
    <Menu
      {...props}
      onClose={() => {
        setSearchTerm('');
        closeStateCallback();
      }}
      sx={{ mt: 1.5, '.MuiMenu-paper': { borderRadius: 5, minWidth: 280 }, zIndex: 1450 }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      <MenuList disablePadding>
        <MenuItem disabled key="choose_token_menu_title">
          <Typography fontWeight="bold" fontSize={16}>
            Choose Token
          </Typography>
        </MenuItem>
        <Box sx={{ px: 1 }}>
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
        </Box>
        <Stack
          maxHeight={350}
          sx={{
            overflowY: 'scroll',
            '-webkit-overflow-scrolling': 'touch'
          }}>
          {preferredTokens.length > 0 && renderTokenList(preferredTokens, 'Preferred Tokens')}
          {otherTokens.length > 0 && (
            <>
              {preferredTokens.length > 0 && <Divider variant="middle" sx={{ my: 1 }} />}
              {renderTokenList(otherTokens)}
            </>
          )}
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
        </Stack>
      </MenuList>
    </Menu>
  );
}
