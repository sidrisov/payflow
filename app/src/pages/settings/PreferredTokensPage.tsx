import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Container, Stack, Typography, TextField } from '@mui/material';
import { green } from '@mui/material/colors';
import { HiOutlineCurrencyDollar } from 'react-icons/hi';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { ProfileContext } from '../../contexts/UserContext';
import { delay } from '../../utils/delay';
import { toast } from 'react-toastify';
import { tokens as SUPPORTED_TOKENS, Token } from '@payflow/common';
import { getNetworkDisplayName } from '../../utils/networks';
import NetworkAvatar from '../../components/avatars/NetworkAvatar';
import TokenAvatar from '../../components/avatars/TokenAvatar';
import { BsCoin } from 'react-icons/bs';
import { GiTwoCoins } from 'react-icons/gi';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../utils/urlConstants';

export default function PreferredTokensPage() {
  const { profile } = useContext(ProfileContext);
  const [selectedTokens, setSelectedTokens] = useState<string[]>(
    () => profile?.preferredTokens || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.preferredTokens) setSelectedTokens(profile.preferredTokens);
  }, [profile]);

  // Get unique tokens and supported chains
  const { uniqueTokens, tokenChains } = useMemo(() => {
    const tokenMap = new Map();
    const chainMap = new Map<string, Set<number>>();

    // Track original order
    const originalOrder = new Map(SUPPORTED_TOKENS.map((token, index) => [token.id, index]));

    SUPPORTED_TOKENS.forEach((token) => {
      // Handle unique tokens
      if (!tokenMap.has(token.id)) {
        tokenMap.set(token.id, token);
      }

      // Track chains for each token
      if (token.chainId) {
        if (!chainMap.has(token.id)) {
          chainMap.set(token.id, new Set());
        }
        chainMap.get(token.id)?.add(token.chainId);
      }
    });

    // Filter tokens based on search term
    let filteredTokens = Array.from(tokenMap.values()).filter((token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort tokens based on multiple criteria
    const sortedTokens = filteredTokens.sort((a, b) => {
      const aIndex = selectedTokens.indexOf(a.id);
      const bIndex = selectedTokens.indexOf(b.id);

      // 1. Selected tokens first, maintaining selection order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // 2. Sort by number of supported chains
      const aChainCount = chainMap.get(a.id)?.size || 0;
      const bChainCount = chainMap.get(b.id)?.size || 0;
      if (aChainCount !== bChainCount) {
        return bChainCount - aChainCount; // More chains first
      }

      // 3. Maintain original order from SUPPORTED_TOKENS
      return (originalOrder.get(a.id) || 0) - (originalOrder.get(b.id) || 0);
    });

    return {
      uniqueTokens: sortedTokens,
      tokenChains: chainMap
    };
  }, [SUPPORTED_TOKENS, selectedTokens, searchTerm]);

  const handleTokenToggle = (tokenId: string) => {
    setSelectedTokens((prev) => {
      if (prev.includes(tokenId)) {
        return prev.filter((id) => id !== tokenId);
      }
      if (prev.length >= 5) {
        toast.warning('You can only select up to 5 tokens', { autoClose: 1000 });
        return prev;
      }
      return [...prev, tokenId];
    });
  };

  const updateTokens = async () => {
    try {
      const response = await axios.put(`${API_URL}/api/tokens/preferred`, selectedTokens, {
        withCredentials: true
      });
      if (response.status === 200) {
        toast.success('Updated! Refreshing', { isLoading: true });
        await delay(1000);
        navigate(0);
      } else {
        toast.error('Something went wrong!');
      }
    } catch (error) {
      toast.error('Failed to save preferred tokens');
    }
  };

  const renderTokenChip = (token: Token) => (
    <Box
      key={token.id}
      onClick={() => handleTokenToggle(token.id)}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 2
      }}>
      <Box display="flex" alignItems="center" gap={2}>
        {selectedTokens.includes(token.id) ? (
          <FaCheckCircle color={green[500]} size={18} />
        ) : (
          <FaRegCircle size={18} />
        )}
        <Box display="flex" alignItems="center" gap={1}>
          <TokenAvatar token={token} sx={{ width: 24, height: 24 }} />
          <Typography>{token.name}</Typography>
        </Box>
      </Box>
      {tokenChains.get(token.id) && (
        <Stack direction="row" sx={{ mt: 1, ml: 4 }} flexWrap="wrap" gap={0.5}>
          {Array.from(tokenChains.get(token.id) || []).map((chainId) => (
            <Chip
              key={chainId}
              label={getNetworkDisplayName(chainId)}
              size="small"
              variant="outlined"
              icon={<NetworkAvatar chainId={chainId} sx={{ width: 16, height: 16 }} />}
              sx={{
                borderRadius: 2,
                '& .MuiChip-label': {
                  p: 1
                },
                p: 0.5
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );

  if (!profile) return null;

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ my: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <GiTwoCoins size={30} />
          <Typography variant="h6">Preferred Tokens</Typography>
        </Stack>

        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Choose up to 5 preferred tokens for receiving and sending payments
        </Typography>

        <TextField
          size="small"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

        <Stack
          spacing={1}
          sx={{
            height: '400px',
            overflowY: 'scroll',
            px: 0.5
          }}>
          {uniqueTokens.map((token) => renderTokenChip(token))}
        </Stack>

        <Button
          variant="outlined"
          color="inherit"
          onClick={updateTokens}
          disabled={selectedTokens.length === 0}
          sx={{ borderRadius: 3 }}>
          Update
        </Button>
      </Stack>
    </Container>
  );
}
