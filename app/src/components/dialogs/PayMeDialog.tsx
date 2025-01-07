import {
  Stack,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Card,
  CardContent,
  Badge,
  Divider
} from '@mui/material';
import { useState, useRef, useContext, useMemo } from 'react';
import { FaCoins, FaDollarSign } from 'react-icons/fa';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { Token } from '@payflow/common';
import ResponsiveDialog from './ResponsiveDialog';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL } from '../../utils/urlConstants';
import { TbCopy } from 'react-icons/tb';
import { createCastPostMessage, createComposeCastUrl } from '../../utils/warpcast';
import { ProfileContext } from '../../contexts/UserContext';
import { ProfileType } from '../../types/ProfileType';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import TokenAvatar from '../avatars/TokenAvatar';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { HiMiniPencilSquare } from 'react-icons/hi2';
import { green } from '@mui/material/colors';
import { FlowType } from '../../types/FlowType';
import FrameV2SDK from '@farcaster/frame-sdk';

interface PayMeDialogProps {
  open: boolean;
  onClose: () => void;
  profile?: ProfileType;
  flow: FlowType;
}

export function PayMeDialog({ open, onClose, profile, flow }: PayMeDialogProps) {
  const { isMiniApp } = useContext(ProfileContext);
  const [isFiatMode, setIsFiatMode] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token>();
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'default' | 'custom'>('default');
  const [customTitle, setCustomTitle] = useState<string>();

  const { isFrameV2 } = useContext(ProfileContext);

  const username = profile?.username;
  const profileImage = profile?.profileImage;

  const address = flow?.wallets[0].address ?? profile?.identity;

  const shareFrameText = 'Send me payments using this frame 💰';

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setCustomTitle(newTitle);
  };

  const paymentFrameUrl = useMemo(() => {
    let paymentFrameUrl = `${DAPP_URL}/${address}`;

    const params = new URLSearchParams();

    if (inputValue) {
      params.append(isFiatMode ? 'usdAmount' : 'tokenAmount', inputValue);
    }
    if (selectedToken) {
      params.append('tokenId', selectedToken.id);
      params.append('chainId', selectedToken.chainId.toString());
    }

    if (customTitle) {
      params.append('title', customTitle);
    }

    const queryString = params.toString();
    if (queryString) {
      paymentFrameUrl += `?${queryString}`;
    }

    return paymentFrameUrl;
  }, [inputValue, selectedToken, customTitle, isFiatMode, address]);

  return (
    <ResponsiveDialog title="Payment Frame" open={open} onClose={onClose} zIndex={1500}>
      <Stack p={1} direction="column" spacing={2} width="100%">
        <Card
          elevation={5}
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '66.67%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}>
          <CardContent
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              p: 3,
              '&:last-child': { pb: 3 }
            }}>
            <Stack spacing={3} height="100%">
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  textAlign: 'center',
                  color: 'text.primary',
                  pt: 1
                }}>
                {mode === 'default' ? '👋🏻 Pay Me' : customTitle || '👋🏻 Pay Me'}
              </Typography>

              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{
                  flex: 1
                }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <Avatar
                    src={profileImage}
                    sx={{
                      width: 32,
                      height: 32,
                      border: '2px solid',
                      borderColor: 'divider'
                    }}
                    slotProps={{
                      img: {
                        onError: (e: any) => {
                          e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${address}`;
                        }
                      }
                    }}
                  />
                  {username && (
                    <Typography variant="subtitle1" fontWeight="bold">
                      {username}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    ({shortenWalletAddressLabel2(address)})
                  </Typography>
                </Stack>
                {mode === 'custom' && inputValue && selectedToken && (
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <NetworkAvatar
                          chainId={selectedToken?.chainId || 0}
                          sx={{ width: 14, height: 14 }}
                        />
                      }>
                      <TokenAvatar token={selectedToken} sx={{ width: 28, height: 28 }} />
                    </Badge>
                    <Typography fontSize={24} fontWeight="bold">
                      {inputValue} {isFiatMode ? 'USD' : selectedToken?.id.toUpperCase()}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Tabs
          value={mode}
          onChange={(_, v) => setMode(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              minWidth: 100,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: green.A700
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: green.A700
            }
          }}>
          <Tab label="Default" value="default" />
          <Tab label="Custom" value="custom" />
        </Tabs>

        {mode === 'custom' && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Custom title (optional)"
              value={customTitle}
              onChange={handleTitleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  height: 45,
                  '&.Mui-focused fieldset': {
                    borderColor: 'inherit !important'
                  }
                }
              }}
            />

            <Stack direction="row" alignItems="center" spacing={1}>
              <TextField
                variant="standard"
                autoFocus
                focused
                placeholder="0"
                value={inputValue}
                onChange={handleInputChange}
                inputRef={inputRef}
                inputMode="decimal"
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: {
                      fontWeight: 'bold',
                      fontSize: 30,
                      padding: 0
                    },
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          size="small"
                          onClick={() => setIsFiatMode(!isFiatMode)}
                          sx={{ color: 'text.secondary' }}>
                          {isFiatMode ? <FaDollarSign /> : <FaCoins />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
              <NetworkTokenSelector
                paymentToken={selectedToken}
                setPaymentToken={setSelectedToken}
                compatibleWallets={flow?.wallets}
                supportedTokens={flow?.supportedTokens}
                showBalance={false}
                zIndex={1500}
              />
            </Stack>
          </Stack>
        )}

        {mode !== 'default' && <Divider />}

        <Stack spacing={1} sx={{ mt: mode === 'default' ? 2 : 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            How would you like to share the payment frame?
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              onClick={() => {
                if (isFrameV2) {
                  FrameV2SDK.actions.openUrl(createComposeCastUrl(shareFrameText, paymentFrameUrl));
                } else if (isMiniApp) {
                  window.parent.postMessage(
                    createCastPostMessage(shareFrameText, paymentFrameUrl),
                    '*'
                  );
                } else {
                  window.open(createComposeCastUrl(shareFrameText, paymentFrameUrl), '_blank');
                }
              }}
              startIcon={<HiMiniPencilSquare />}
              variant="outlined"
              size="small"
              color="inherit"
              sx={{
                fontSize: 14,
                fontWeight: 'normal',
                height: 45,
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 3,
                borderColor: 'divider',
                textTransform: 'none'
              }}>
              Cast
            </Button>

            <Button
              fullWidth
              onClick={() => {
                copyToClipboard(paymentFrameUrl);
              }}
              startIcon={<TbCopy />}
              variant="outlined"
              size="small"
              color="inherit"
              sx={{
                fontSize: 14,
                fontWeight: 'normal',
                height: 45,
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 3,
                borderColor: 'divider',
                textTransform: 'none'
              }}>
              Copy link
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </ResponsiveDialog>
  );
}
