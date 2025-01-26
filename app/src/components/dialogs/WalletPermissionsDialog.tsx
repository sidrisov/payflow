import {
  Stack,
  Typography,
  Badge,
  Card,
  CardContent,
  Box,
  IconButton,
  LinearProgress,
  Avatar,
  Button
} from '@mui/material';
import { useState, useEffect } from 'react';
import { FlowType, WalletSessionType } from '@payflow/common';
import { formatUnits } from 'viem';
import ResponsiveDialog from './ResponsiveDialog';
import TokenAvatar from '../avatars/TokenAvatar';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { getTokensByChain } from '@payflow/common';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistanceToNow } from 'date-fns';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CopyToClipboardIconButton from '../buttons/CopyToClipboardIconButton';
import { AddPermissionDialog } from '../dialogs/AddPermissionDialog';
import { green, red, orange } from '@mui/material/colors';
import axios from 'axios';
import { base } from 'viem/chains';
import { API_URL } from '../../utils/urlConstants';

interface Props {
  open: boolean;
  onClose: () => void;
  flow: FlowType;
}

// Mock data for testing
const MOCK_SPEND_SESSIONS: WalletSessionType[] = [
  /* {
    sessionId: 'mock_spend_session_1',
    active: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    actions: [
      {
        type: 'spend',
        token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC (6 decimals)
        limit: '500000000', // 5000 USDC
        spent: '400000000' // 1000 USDC spent
      },
      {
        type: 'spend',
        token: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', // Degen (18 decimals)
        limit: '1000000000000000000000', // 1 Degen
        spent: '100000000000000000000' // 0.25 Degen spent
      }
    ]
  } */
];

export function WalletPermissionsDialog({ open, onClose, flow }: Props) {
  const wallet = flow.wallets.find((w) => w.network === base.id);
  const tokens = getTokensByChain(wallet?.network);
  const [sessions, setSessions] = useState<WalletSessionType[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [errorSessions, setErrorSessions] = useState<string | null>(null);

  const [showAddPermission, setShowAddPermission] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      setErrorSessions(null);
      const { data } = await axios.get<WalletSessionType[]>(
        `${API_URL}/api/flows/${flow.uuid}/wallets/${wallet?.address}/${wallet?.network}/sessions`,
        { withCredentials: true }
      );
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setErrorSessions('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await axios.delete(
        `${API_URL}/api/flows/${flow.uuid}/wallets/${wallet?.address}/${wallet?.network}/sessions/${sessionId}`,
        { withCredentials: true }
      );
      await fetchSessions(); // Refresh sessions after deletion
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open, flow.uuid, wallet?.address, wallet?.network]);

  const calculateSpentProgress = (spent: string, limit: string) => {
    if (limit === '0') return 0;
    const spentBig = BigInt(spent);
    const limitBig = BigInt(limit);
    // Convert to number after calculation to avoid floating point issues
    return Number((spentBig * BigInt(100)) / limitBig);
  };

  return (
    <>
      <ResponsiveDialog title="Permission Sessions" open={open} onClose={onClose}>
        <Box display="flex" flexDirection="column" gap={2} p={2} width="100%">
          {loadingSessions ? (
            <LinearProgress
              sx={{
                '& .MuiLinearProgress-bar': {
                  bgcolor: green.A700
                }
              }}
            />
          ) : errorSessions ? (
            <Typography color="error">{errorSessions}</Typography>
          ) : sessions.length === 0 ? (
            <Typography color="textSecondary" align="center">
              No active sessions found
            </Typography>
          ) : (
            [...sessions, ...MOCK_SPEND_SESSIONS]?.map((session, index) => (
              <Card
                key={`session_${index}`}
                elevation={5}
                sx={{
                  width: '100%',
                  borderRadius: 3
                }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                        {`Session ${session.sessionId.slice(0, 8)}...${session.sessionId.slice(-6)}`}
                      </Typography>
                      <CopyToClipboardIconButton
                        tooltip="Copy session ID"
                        value={session.sessionId}
                        iconSize={16}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      aria-label="delete"
                      onClick={() => handleDeleteSession(session.sessionId)}
                      sx={{ color: 'error.main' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ width: '100%', mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                      Expires {formatDistanceToNow(session.expiresAt, { addSuffix: true })}
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    {session.actions?.map((action, actionIndex) => {
                      if (action.type === 'sudo') {
                        return (
                          <Box
                            key={`limit_${actionIndex}`}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: 'warning.soft',
                              border: '1px solid',
                              borderColor: 'warning.main'
                            }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: 'warning.main'
                                }}>
                                <AdminPanelSettingsIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  Sudo Access
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Full wallet access
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      }

                      const token = tokens?.find(
                        (t) => t.tokenAddress?.toLowerCase() === action.token?.toLowerCase()
                      );
                      if (!token) return null;

                      const spentProgress = calculateSpentProgress(action.spent, action.limit);

                      return (
                        <Box
                          key={`limit_${actionIndex}`}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: 'action.hover'
                          }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={
                                <NetworkAvatar
                                  chainId={token?.chainId || flow.wallets[0].network}
                                  sx={{ width: 14, height: 14 }}
                                />
                              }>
                              <TokenAvatar token={token} sx={{ width: 32, height: 32 }} />
                            </Badge>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {token
                                ? formatUnits(BigInt(action.limit || '0'), token.decimals)
                                : action.limit || '0'}{' '}
                              {token?.id || 'tokens'}
                            </Typography>
                          </Box>

                          <Box sx={{ width: '100%' }}>
                            <LinearProgress
                              variant="determinate"
                              value={spentProgress}
                              sx={{
                                height: 4,
                                borderRadius: 3,
                                bgcolor: 'action.selected',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor:
                                    (spentProgress > 90 && red.A700) ||
                                    (spentProgress <= 20 && green.A700) ||
                                    orange.A700,
                                  borderRadius: 3
                                }
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                              {token
                                ? formatUnits(BigInt(action.spent || '0'), token.decimals)
                                : action.spent || '0'}{' '}
                              spent of{' '}
                              {token
                                ? formatUnits(BigInt(action.limit || '0'), token.decimals)
                                : action.limit || '0'}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}

          <Button variant="contained" onClick={() => setShowAddPermission(true)}>
            New session
          </Button>
        </Box>
      </ResponsiveDialog>

      {showAddPermission && (
        <AddPermissionDialog
          flow={flow}
          open={showAddPermission}
          onClose={() => setShowAddPermission(false)}
          onSuccess={() => {
            setShowAddPermission(false);
            fetchSessions();
          }}
        />
      )}
    </>
  );
}
