import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import { useContext, useState } from 'react';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Icon,
  Stack,
  SvgIcon,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { FlowType } from '../types/FlowType';
import QRCode from 'react-qr-code';

import Logo from '../assets/logo.svg?react';
import { blue, green, purple, red, yellow } from '@mui/material/colors';
import { Check } from '@mui/icons-material';
import { DAPP_URL } from '../utils/urlConstants';

enum ComponentVariant {
  Button = 'Button',
  Widget = 'Widget',
  QR = 'QR Code'
}

enum ComponentColor {
  No,
  Yellow,
  Purple,
  Blue,
  Green,
  Red
}

const colors = [-1, yellow[600], purple[400], blue[400], green[400], red[400]];

export default function Widgets() {
  const {
    isAuthenticated,
    profile: { flows },
    appSettings
  } = useContext(ProfileContext);
  const [selectedFlow, setSelectedFlow] = useState<FlowType>();
  const [componentVariant, setComponentVariant] = useState<ComponentVariant>(
    ComponentVariant.Button
  );
  const [componentColor, setComponentColor] = useState<ComponentColor>(ComponentColor.Green);

  const [buttonText, setButtonText] = useState<string>('Support With Crypto');
  const [buttonIncludeTitle, setButtonIncludeTitle] = useState<boolean>(false);
  const [buttonIncludeBalance, setButtonIncludeBalance] = useState<boolean>(false);
  const [widgetAmount, setWidgetAmount] = useState<number>(0);

  return (
    <>
      <Helmet>
        <title> Payflow | Branding </title>
      </Helmet>
      <Typography variant="caption" color="red">
        * Experimental feature
      </Typography>

      <Container>
        {isAuthenticated && (
          <Box m={2} display="flex" flexWrap="wrap">
            <Box display="flex" flexDirection="column" sx={{ p: 1, minHeight: 300, minWidth: 300 }}>
              <Card
                elevation={10}
                sx={{
                  p: 2,
                  border: 3,
                  borderRadius: 5,
                  borderStyle: 'double',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                <Autocomplete
                  autoHighlight
                  onChange={(_event, value) => {
                    if (value) {
                      setSelectedFlow(value);
                    } else {
                      setSelectedFlow(undefined);
                    }
                  }}
                  options={flows ?? []}
                  getOptionLabel={(option) => option.title}
                  renderInput={(params) => (
                    <TextField variant="outlined" {...params} label="Select Flow" />
                  )}
                  sx={{ '& fieldset': { borderRadius: 5 } }}
                />
                <Box
                  sx={{
                    mt: 2,
                    borderRadius: 5,
                    border: 1,
                    borderColor: 'divider'
                  }}>
                  <Stack m={1} direction="row" spacing={3} justifyContent="space-evenly">
                    <Chip
                      label={ComponentVariant.Button}
                      clickable={componentVariant !== ComponentVariant.Button}
                      variant={componentVariant === ComponentVariant.Button ? 'filled' : 'outlined'}
                      onClick={() => {
                        setComponentVariant(ComponentVariant.Button);
                      }}
                      sx={{
                        border: 0,
                        color:
                          componentVariant === ComponentVariant.Button
                            ? appSettings.darkMode
                              ? 'white'
                              : 'black'
                            : 'GrayText',
                        '& .MuiChip-label': {
                          fontSize: 16
                        }
                      }}
                    />
                    <Chip
                      label={ComponentVariant.Widget}
                      clickable={componentVariant !== ComponentVariant.Widget}
                      variant={componentVariant === ComponentVariant.Widget ? 'filled' : 'outlined'}
                      onClick={() => {
                        setComponentVariant(ComponentVariant.Widget);
                      }}
                      sx={{
                        border: 0,
                        color:
                          componentVariant === ComponentVariant.Widget
                            ? appSettings.darkMode
                              ? 'white'
                              : 'black'
                            : 'GrayText',
                        '& .MuiChip-label': {
                          fontSize: 16
                        }
                      }}
                    />
                    <Chip
                      label={ComponentVariant.QR}
                      clickable={componentVariant !== ComponentVariant.QR}
                      variant={componentVariant === ComponentVariant.QR ? 'filled' : 'outlined'}
                      onClick={() => {
                        setComponentVariant(ComponentVariant.QR);
                      }}
                      sx={{
                        border: 0,
                        color:
                          componentVariant === ComponentVariant.QR
                            ? appSettings.darkMode
                              ? 'white'
                              : 'black'
                            : 'GrayText',
                        '& .MuiChip-label': {
                          fontSize: 16
                        }
                      }}
                    />
                  </Stack>
                </Box>

                <Typography mt={2} variant="body2">
                  Component Variant
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Avatar
                    onClick={() => {
                      setComponentColor(ComponentColor.No);
                    }}
                    sx={{
                      bgcolor: 'paper',
                      border: 2,
                      borderStyle: 'double'
                    }}>
                    <Icon>{componentColor === ComponentColor.No && <Check />}</Icon>
                  </Avatar>
                  <Avatar
                    onClick={() => {
                      setComponentColor(ComponentColor.Yellow);
                    }}
                    sx={{
                      bgcolor: colors[ComponentColor.Yellow],
                      border: 2,
                      borderStyle: 'double'
                    }}>
                    <Icon>{componentColor === ComponentColor.Yellow && <Check />}</Icon>
                  </Avatar>
                  <Avatar
                    onClick={() => {
                      setComponentColor(ComponentColor.Purple);
                    }}
                    sx={{
                      bgcolor: colors[ComponentColor.Purple],
                      border: 2,
                      borderStyle: 'double'
                    }}>
                    <Icon>{componentColor === ComponentColor.Purple && <Check />}</Icon>
                  </Avatar>
                  <Avatar
                    onClick={() => {
                      setComponentColor(ComponentColor.Blue);
                    }}
                    sx={{ bgcolor: colors[ComponentColor.Blue], border: 2, borderStyle: 'double' }}>
                    <Icon>{componentColor === ComponentColor.Blue && <Check />}</Icon>
                  </Avatar>
                  <Avatar
                    onClick={() => {
                      setComponentColor(ComponentColor.Green);
                    }}
                    sx={{
                      bgcolor: colors[ComponentColor.Green],
                      border: 2,
                      borderStyle: 'double'
                    }}>
                    <Icon>{componentColor === ComponentColor.Green && <Check />}</Icon>
                  </Avatar>
                  <Avatar
                    onClick={() => {
                      setComponentColor(ComponentColor.Red);
                    }}
                    sx={{ bgcolor: colors[ComponentColor.Red], border: 2, borderStyle: 'double' }}>
                    <Icon>{componentColor === ComponentColor.Red && <Check />}</Icon>
                  </Avatar>
                </Stack>
              </Card>
              {componentVariant && componentVariant !== ComponentVariant.QR && (
                <Card
                  elevation={10}
                  sx={{
                    mt: 2,
                    p: 2,
                    border: 3,
                    borderRadius: 5,
                    borderStyle: 'double',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                  <Typography variant="body2">{`${componentVariant} Settings`}</Typography>
                  {componentVariant === ComponentVariant.Button && (
                    <>
                      <TextField
                        margin="dense"
                        fullWidth
                        id="buttonText"
                        defaultValue={buttonText}
                        label="Button Text"
                        InputProps={{ inputProps: { maxLength: 20 }, sx: { borderRadius: 3 } }}
                        onChange={(event) => {
                          setButtonText(event.target.value);
                        }}
                      />
                      <Box>
                        <FormControlLabel
                          labelPlacement="end"
                          control={
                            <Switch
                              size="small"
                              color="info"
                              checked={buttonIncludeTitle}
                              onChange={() => {
                                setButtonIncludeTitle(!buttonIncludeTitle);
                              }}
                            />
                          }
                          label="Title"
                        />
                        <FormControlLabel
                          labelPlacement="end"
                          control={
                            <Switch
                              size="small"
                              color="info"
                              checked={buttonIncludeBalance}
                              onChange={() => {
                                setButtonIncludeBalance(!buttonIncludeBalance);
                              }}
                            />
                          }
                          label="Balance"
                        />
                      </Box>
                    </>
                  )}
                  {componentVariant === ComponentVariant.Widget && (
                    <>
                      <TextField
                        margin="dense"
                        fullWidth
                        id="buttonText"
                        defaultValue={buttonText}
                        label="Button Text"
                        InputProps={{ inputProps: { maxLength: 20 }, sx: { borderRadius: 3 } }}
                        onChange={(event) => {
                          setButtonText(event.target.value);
                        }}
                      />
                      <Box>
                        <FormControlLabel
                          labelPlacement="end"
                          control={
                            <Switch
                              size="small"
                              color="info"
                              checked={buttonIncludeTitle}
                              onChange={() => {
                                setButtonIncludeTitle(!buttonIncludeTitle);
                              }}
                            />
                          }
                          label="Title"
                        />
                      </Box>
                    </>
                  )}
                </Card>
              )}
            </Box>
            {selectedFlow && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexGrow={1}
                sx={{ p: 1 }}>
                {componentVariant === ComponentVariant.Button && (
                  <Card
                    elevation={10}
                    sx={{
                      bgcolor: colors[componentColor],
                      p: 2,
                      border: 2,
                      borderRadius: 5,
                      borderStyle: 'double',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      maxWidth: 300
                    }}>
                    <SvgIcon component={Logo} inheritViewBox fontSize="large" />
                    <Box
                      ml={1}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      alignItems="center">
                      <Typography variant="subtitle2">{buttonText}</Typography>
                      {buttonIncludeTitle && (
                        <Typography variant="caption">{selectedFlow?.title}</Typography>
                      )}
                    </Box>
                    {buttonIncludeBalance && (
                      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
                    )}

                    {buttonIncludeBalance && <Typography variant="body2">10000$</Typography>}
                  </Card>
                )}
                {componentVariant === ComponentVariant.Widget && (
                  <Card
                    elevation={10}
                    sx={{
                      p: 3,
                      border: 2,
                      borderRadius: 5,
                      borderStyle: 'double',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      maxWidth: 250
                    }}>
                    {buttonIncludeTitle && (
                      <Typography variant="h6" color={colors[componentColor].toString()}>
                        {selectedFlow?.title}
                      </Typography>
                    )}

                    <TextField
                      variant="filled"
                      id="sendAmount"
                      value={widgetAmount}
                      type="number"
                      placeholder="0"
                      inputProps={{
                        style: {
                          textAlign: 'center',
                          fontSize: 30,
                          color: colors[componentColor].toString()
                        }
                      }}
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          borderColor: colors[componentColor],
                          borderRadius: 5,
                          height: 80
                        }
                      }}
                      onChange={(event) => {
                        console.log(event.target.value);
                        setWidgetAmount(Number.parseInt(event.target.value));
                      }}
                    />
                    <Stack m={1} direction="row" spacing={1} alignItems="center">
                      <Avatar
                        onClick={() => {
                          setWidgetAmount(widgetAmount + 1);
                        }}
                        sx={{
                          bgcolor: colors[componentColor],
                          border: 2,
                          borderStyle: 'double',
                          width: 42,
                          height: 42
                        }}>
                        +1$
                      </Avatar>
                      <Avatar
                        onClick={() => {
                          setWidgetAmount(widgetAmount + 5);
                        }}
                        sx={{
                          bgcolor: colors[componentColor],
                          border: 2,
                          borderStyle: 'double',
                          width: 48,
                          height: 48
                        }}>
                        +5$
                      </Avatar>
                      <Avatar
                        onClick={() => {
                          setWidgetAmount(widgetAmount + 10);
                        }}
                        sx={{
                          bgcolor: colors[componentColor],
                          border: 2,
                          borderStyle: 'double',
                          width: 54,
                          height: 54
                        }}>
                        +10$
                      </Avatar>
                    </Stack>
                    <Button
                      fullWidth
                      variant="contained"
                      size="medium"
                      onClick={() => {}}
                      sx={{
                        mt: 1,
                        borderRadius: 3,
                        bgcolor: colors[componentColor],
                        '&:hover': { bgcolor: colors[componentColor] }
                      }}>
                      {buttonText}
                    </Button>
                  </Card>
                )}
                {componentVariant === ComponentVariant.QR && (
                  <Card
                    elevation={10}
                    sx={{
                      p: 2,
                      border: 3,
                      borderRadius: 5,
                      borderStyle: 'double',
                      borderColor: 'divider',
                      bgcolor: colors[componentColor]
                    }}>
                    <QRCode
                      alignmentBaseline="central"
                      alphabetic="true"
                      bgColor={
                        colors[componentColor] !== -1
                          ? colors[componentColor].toString()
                          : undefined
                      }
                      value={`${DAPP_URL}/jar/${selectedFlow?.uuid}`}
                    />
                  </Card>
                )}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}
