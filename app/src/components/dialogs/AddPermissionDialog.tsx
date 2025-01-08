import { useContext, useEffect, useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Stack,
  Button,
  IconButton,
  Typography
} from '@mui/material';
import { AdminPanelSettings, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { IoIosWallet } from 'react-icons/io';
import ResponsiveDialog from './ResponsiveDialog';
import { FlowType } from '@payflow/common';
import { usePublicClient, useWalletClient } from 'wagmi';
import { ConnectSignerDialog } from './ConnectSignerDialog';
import { getPermissionId, getSudoPolicy, Session } from '@rhinestone/module-sdk';
import { Account, Address, Chain, PublicClient, toHex, Transport, WalletClient } from 'viem';
import { OWNABLE_VALIDATOR_ADDRESS } from '@rhinestone/module-sdk';
import { encodeValidationData } from '@rhinestone/module-sdk';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { manageSessions } from '@payflow/common';
import { ProfileContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../utils/urlConstants';
import { CustomLoadingButton } from '../buttons/LoadingPaymentButton';
import { addDays } from 'date-fns';
/* import { TokenSelect } from '../inputs/TokenSelect';
import { TokenAmountInput } from '../inputs/TokenAmountInput'; */

type PermissionType = 'sudo' | 'spend';

interface SpendLimit {
  token: string;
  amount: string;
}

interface Props {
  flow: FlowType;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPermissionDialog({ flow, open, onClose, onSuccess }: Props) {
  const { profile } = useContext(ProfileContext);
  const [selectedType, setSelectedType] = useState<PermissionType | null>(null);
  const [spendLimits, setSpendLimits] = useState<SpendLimit[]>([{ token: '', amount: '' }]);

  const [openConnectSignerDrawer, setOpenConnectSignerDrawer] = useState(false);

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const publicClient = usePublicClient({ chainId: base.id });
  const { data: signer, isLoading: isLoadingSigner } = useWalletClient({ chainId: base.id });

  console.log('signer', signer);

  useEffect(() => {
    // Skip if drawer is already open
    if (openConnectSignerDrawer) return;

    // Delay the check by 2 seconds
    const timer = setTimeout(() => {
      // Only proceed if we're not pending
      if (!isLoadingSigner) {
        // If no signer or addresses don't match, show connect drawer
        if (!signer || flow.signer.toLowerCase() !== signer.account.address.toLowerCase()) {
          setOpenConnectSignerDrawer(true);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [flow.signer, signer, isLoadingSigner, openConnectSignerDrawer]);

  const handleBack = () => {
    setSelectedType(null);
    setSpendLimits([{ token: '', amount: '' }]);
  };

  const handleAddToken = () => {
    setSpendLimits([...spendLimits, { token: '', amount: '' }]);
  };

  const handleRemoveToken = (index: number) => {
    setSpendLimits(spendLimits.filter((_, i) => i !== index));
  };

  const handleTokenChange = (index: number, token: string) => {
    const newLimits = [...spendLimits];
    newLimits[index].token = token;
    setSpendLimits(newLimits);
  };

  const handleAmountChange = (index: number, amount: string) => {
    const newLimits = [...spendLimits];
    newLimits[index].amount = amount;
    setSpendLimits(newLimits);
  };

  const handleCreateSubmit = async () => {
    if (!selectedType) return;

    setIsCreatingSession(true);

    // Save session to backend
    const wallet = flow.wallets.find((w) => w.network === base.id);
    if (!wallet) {
      toast.error('Wallet not found');
      return;
    }

    try {
      const sessionKey = generatePrivateKey();
      const sessionKeyAccount = privateKeyToAccount(sessionKey);

      let session: Session | undefined;
      if (selectedType === 'sudo') {
        session = {
          sessionValidator: OWNABLE_VALIDATOR_ADDRESS,
          permitERC4337Paymaster: true,
          sessionValidatorInitData: encodeValidationData({
            threshold: 1,
            owners: [sessionKeyAccount.address]
          }),
          salt: toHex(crypto.getRandomValues(new Uint8Array(32))),
          userOpPolicies: [getSudoPolicy()],
          erc7739Policies: {
            allowedERC7739Content: [],
            erc1271Policies: []
          },
          actions: [
            {
              actionTarget: '0x0000000000000000000000000000000000000001',
              actionTargetSelector: '0x00000001',
              actionPolicies: [getSudoPolicy()]
            }
          ],
          chainId: BigInt(base.id)
        };
      }

      if (!session) {
        toast.error('Failed to create session');
        return;
      }

      const owners: Address[] = [];
      if (flow.signerProvider && flow.signer.toLowerCase() !== profile!.identity.toLowerCase()) {
        owners.push(profile!.identity);
      }
      owners.push(flow.signer);

      const opHash = await manageSessions(
        publicClient as PublicClient<Transport, Chain>,
        signer as WalletClient<Transport, Chain, Account>,
        wallet.address,
        owners,
        flow.saltNonce,
        [session],
        [],
        {
          sponsoredTx: true
        }
      );

      if (!opHash) {
        toast.error('Failed to create session');
        return;
      }

      const sessionData = {
        sessionId: getPermissionId({ session }),
        sessionKey: sessionKey,
        actions:
          selectedType === 'sudo'
            ? [{ type: 'sudo' }]
            : spendLimits.map((limit) => ({
                type: 'spend',
                token: limit.token,
                limit: limit.amount
              })),
        active: true,
        expiresAt: addDays(new Date(), 7)
      };

      await axios.post(
        `${API_URL}/api/flows/${flow.uuid}/wallets/${wallet.address}/${wallet.network}/sessions`,
        sessionData,
        { withCredentials: true }
      );

      toast.success('Session created successfully!');
      onSuccess();
      onClose();
      // Reset state
      setSelectedType(null);
      setSpendLimits([{ token: '', amount: '' }]);
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (!selectedType) {
    return (
      <ResponsiveDialog
        title="Select Permission Type"
        open={open}
        onClose={() => {
          setSelectedType(null);
          onClose();
        }}
        width={320}>
        <List disablePadding dense sx={{ p: 0.5, width: '100%', gap: 1 }}>
          <ListItemButton onClick={() => setSelectedType('sudo')} sx={{ borderRadius: 5 }}>
            <ListItemIcon>
              <AdminPanelSettings />
            </ListItemIcon>
            <Box>
              <ListItemText primary="Sudo Access" />
              <ListItemText
                secondary="Full wallet access"
                slotProps={{
                  secondary: {
                    color: 'text.secondary',
                    variant: 'caption'
                  }
                }}
              />
            </Box>
          </ListItemButton>
          <ListItemButton
            disabled
            onClick={() => setSelectedType('spend')}
            sx={{ borderRadius: 5 }}>
            <ListItemIcon>
              <IoIosWallet size={24} />
            </ListItemIcon>
            <Box>
              <ListItemText primary="Spending Limit" />
              <ListItemText
                secondary="Set token allowances"
                slotProps={{
                  secondary: {
                    color: 'text.secondary',
                    variant: 'caption'
                  }
                }}
              />
            </Box>
          </ListItemButton>
        </List>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog
      title={selectedType === 'sudo' ? 'Create Sudo Access' : 'Create Spending Limits'}
      open={open}
      onClose={() => {
        setSelectedType(null);
        onClose();
      }}
      width={400}>
      <Box display="flex" flexDirection="column" gap={2} width="100%" p={2}>
        {selectedType === 'sudo' ? (
          <ListItemText
            secondary={
              <Typography textAlign="center" variant="subtitle2" color="text.secondary">
                This will grant full wallet access to the selected account.
              </Typography>
            }
          />
        ) : (
          <>
            <Stack spacing={2}>
              {spendLimits.map((limit, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'action.hover'
                  }}>
                  <Stack spacing={2} flex={1}>
                    {/* <TokenSelect
                      value={limit.token}
                      onChange={(token) => handleTokenChange(index, token)}
                    />
                    <TokenAmountInput
                      value={limit.amount}
                      onChange={(amount) => handleAmountChange(index, amount)}
                      token={limit.token}
                    /> */}
                  </Stack>
                  {spendLimits.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveToken(index)}
                      sx={{ color: 'error.main' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Stack>

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddToken}
              sx={{
                borderRadius: 2,
                borderStyle: 'dashed'
              }}>
              Add Token
            </Button>
          </>
        )}

        <CustomLoadingButton
          size="medium"
          title="Create"
          loading={isCreatingSession}
          status={isCreatingSession ? 'Creating ...' : ''}
          onClick={handleCreateSubmit}
          borderRadius={3}
        />
      </Box>
      <ConnectSignerDialog
        open={openConnectSignerDrawer}
        onClose={() => setOpenConnectSignerDrawer(false)}
        flow={flow}
      />
    </ResponsiveDialog>
  );
}
