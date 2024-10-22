import { Box, Typography, CircularProgress, Badge } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { formatUnits } from 'viem';
import { FlowWalletType } from '../types/FlowType';
import { Token, getSupportedTokens } from '../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import { NetworkSelectorButton } from './buttons/NetworkSelectorButton';
import { TokenSelectorButton } from './buttons/TokenSelectorButton';
import { FeeSection } from './dialogs/GasFeeSection';
import { PaymentType } from '../types/PaymentType';
import { degen } from 'viem/chains';
import { useAssetBalances } from '../utils/queries/balances';
import { getFlowWalletAssets } from '../utils/assets';
import ResponsiveDialog from './dialogs/ResponsiveDialog';
import NetworkAvatar from './avatars/NetworkAvatar';
import TokenAvatar from './avatars/TokenAvatar';
import { Chip } from '@mui/material';
import { IoIosArrowDown } from 'react-icons/io';

export function NetworkTokenSelector({
  payment,
  crossChainMode = false,
  paymentWallet,
  setPaymentWallet,
  compatibleWallets,
  paymentToken,
  setPaymentToken,
  enabledChainCurrencies,
  gasFee,
  showBalance = true,
  expandSection = false
}: {
  payment?: PaymentType;
  crossChainMode?: boolean;
  paymentWallet: FlowWalletType | undefined;
  setPaymentWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
  compatibleWallets: FlowWalletType[];
  paymentToken?: Token;
  setPaymentToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  enabledChainCurrencies?: string[];
  gasFee?: bigint;
  showBalance?: boolean;
  expandSection?: boolean;
}) {
  const [expand, setExpand] = useState<boolean>(expandSection);
  const [compatibleTokens, setCompatibleTokens] = useState<Token[]>([]);

  const [maxBalance, setMaxBalance] = useState<string>('0.0');
  const [maxBalanceUsd, setMaxBalanceUsd] = useState<string>('0.0');

  const { isFetched: isBalanceFetched, data: balances } = useAssetBalances(
    showBalance && paymentWallet ? getFlowWalletAssets(paymentWallet) : []
  );

  useMemo(async () => {
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

        const maxBalanceUsd = paymentTokenBalance ? paymentTokenBalance.usdValue : 0;

        setMaxBalance(normalizeNumberPrecision(maxBalance));
        setMaxBalanceUsd(normalizeNumberPrecision(maxBalanceUsd));
      }
    }
  }, [isBalanceFetched, paymentToken, balances]);

  useEffect(() => {
    // don't update if selected token was already selected
    if (paymentToken && compatibleTokens.find((t) => t === paymentToken)) {
      return;
    }

    setPaymentToken(compatibleTokens[0]);
  }, [paymentToken, compatibleTokens, paymentWallet?.network]);

  console.log('Compatible tokens: ', compatibleTokens);
  console.log('Selected token: ', paymentToken);

  useMemo(() => {
    if (!paymentWallet) {
      return;
    }
    // filter by passed token if available
    const tokens = getSupportedTokens(paymentWallet.network).filter((t) =>
      !crossChainMode && payment?.token ? t.id === payment?.token : true
    );

    const compatibleTokens = enabledChainCurrencies
      ? tokens.filter((t) =>
          enabledChainCurrencies.find(
            (c) =>
              c ===
              `eip155:${paymentWallet.network}/${
                t.tokenAddress
                  ? `erc20:${t.tokenAddress}`
                  : paymentWallet.network === degen.id
                  ? 'slip44:33436'
                  : 'slip44:60'
              }`
          )
        )
      : tokens;

    // return at least 1
    setCompatibleTokens(
      !showBalance || payment?.token || crossChainMode
        ? compatibleTokens
        : (function () {
            const filteredTokens = compatibleTokens.filter(
              (token) =>
                balances?.find((balance) => balance.asset.token === token)?.balance?.value ?? 0 > 0
            );
            // If no tokens are found with a balance > 0, select at least the first token
            return filteredTokens.length > 0 ? filteredTokens : [compatibleTokens[0]];
          })()
    );
  }, [crossChainMode, paymentWallet, enabledChainCurrencies, balances]);

  const label = `${crossChainMode ? 'Cross-Chain ' : ''}Payment Token`;

  const paymentTokenSelectable =
    (!payment?.token || crossChainMode) && paymentToken && (!showBalance || isBalanceFetched);
  return (
    <>
      <Chip
        icon={
          paymentToken ? (
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
          paymentToken ? (
            <Typography variant="subtitle2" textTransform="uppercase">
              {showBalance ? formatAmountWithSuffix(maxBalance) : ''} {paymentToken.id}
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

      {paymentToken && paymentWallet && compatibleTokens && (
        <ResponsiveDialog
          open={expand}
          onClose={() => setExpand(false)}
          title={label}
          zIndex={1450}>
          <Box
            width="100%"
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
              <Typography variant="caption" fontWeight={500}>
                Network
              </Typography>

              <NetworkSelectorButton
                selectedWallet={paymentWallet}
                setSelectedWallet={setPaymentWallet}
                wallets={compatibleWallets}
              />
            </Box>

            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption" fontWeight={500}>
                Token
              </Typography>
              <TokenSelectorButton
                selectedToken={paymentToken}
                setSelectedToken={setPaymentToken}
                tokens={compatibleTokens}
              />
            </Box>

            {showBalance && (
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center">
                <Typography variant="caption" fontWeight={500}>
                  Balance
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {`${formatAmountWithSuffix(maxBalance)} ${
                    paymentToken?.name
                  } ≈ $${maxBalanceUsd}`}
                </Typography>
              </Box>
            )}
            {gasFee !== undefined && (
              <FeeSection
                type="gas"
                tooltip="Gas is paid by the sending flow wallet via Gelato SyncFee call method. 
                    The fee includes Gelato onchain call, safe tx fee + deployment fee on the first tx, and 10% Gelato's comission on top of all."
                title="Transaction fee"
                token={paymentToken}
                fee={gasFee}
              />
            )}
            {crossChainMode && (
              <FeeSection
                type="cross-chain"
                tooltip="Charged fee for fasciliating cross-chain payments"
                title="Cross-chain fee"
                token={paymentToken}
                fee={BigInt(0)}
              />
            )}
          </Box>
        </ResponsiveDialog>
      )}
    </>
  );
}
