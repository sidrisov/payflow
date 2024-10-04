import { Stack, Box, Typography } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { formatUnits } from 'viem';
import { FlowWalletType } from '../types/FlowType';
import { Token, getSupportedTokens } from '../utils/erc20contracts';
import { getNetworkDisplayName } from '../utils/networks';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import { NetworkSelectorButton } from './buttons/NetworkSelectorButton';
import { TokenSelectorButton } from './buttons/TokenSelectorButton';
import { FeeSection } from './dialogs/GasFeeSection';
import { PaymentType } from '../types/PaymentType';
import { degen } from 'viem/chains';
import { MdMultipleStop } from 'react-icons/md';
import { TbSend } from 'react-icons/tb';
import { useAssetBalances } from '../utils/queries/balances';
import { getFlowWalletAssets } from '../utils/assets';
import ResponsiveDialog from './dialogs/ResponsiveDialog';
import NetworkAvatar from './avatars/NetworkAvatar';

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

  const paymentTokenSelectable = paymentToken && (!showBalance || isBalanceFetched);
  return (
    <>
      <Box
        maxWidth={200}
        px={0.5}
        display="flex"
        flexDirection="row"
        justifyContent="flex-start"
        alignItems="center"
        gap={1}
        {...(paymentTokenSelectable && {
          onClick: () => setExpand(true)
        })}
        sx={{
          height: 40,
          borderRadius: 5,
          WebkitTapHighlightColor: 'transparent',
          ...(paymentTokenSelectable && {
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          })
        }}>
        {crossChainMode ? (
          <MdMultipleStop color="inherit" size={20} />
        ) : (
          <TbSend color="inherit" size={20} />
        )}
        <Typography fontSize={13} fontWeight="bold">
          Token
        </Typography>
        {paymentTokenSelectable ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              fontSize={13}
              fontWeight="bold"
              noWrap
              maxWidth={80}
              textOverflow="ellipsis"
              overflow="hidden">
              {`${formatAmountWithSuffix(maxBalance)} ${paymentToken?.name}`}
            </Typography>
            <NetworkAvatar chainId={paymentToken.chainId} sx={{ width: 15, height: 15 }} />
          </Stack>
        ) : (
          <Typography variant="subtitle2">...</Typography>
        )}
      </Box>

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
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" fontWeight="bold">
                  {getNetworkDisplayName(paymentWallet.network)}
                </Typography>
                <NetworkSelectorButton
                  selectedWallet={paymentWallet}
                  setSelectedWallet={setPaymentWallet}
                  wallets={compatibleWallets}
                />
              </Stack>
            </Box>

            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption" fontWeight={500}>
                Token
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" fontWeight="bold">
                  {paymentToken?.name}
                </Typography>
                <TokenSelectorButton
                  selectedToken={paymentToken}
                  setSelectedToken={setPaymentToken}
                  tokens={compatibleTokens}
                />
              </Stack>
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
