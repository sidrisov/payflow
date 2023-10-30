import { SelectAll } from '@mui/icons-material';
import { Avatar, Box, Chip, Stack, useMediaQuery, useTheme } from '@mui/material';
import { AccountType } from '../types/AccountType';

export type AssetsProps = {
  accounts: AccountType[] | undefined;
};

export default function Activity(props: AssetsProps) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Stack
        overflow="scroll"
        m={1}
        spacing={1}
        justifyContent={smallScreen ? 'flex-start' : 'center'}
        direction="column"
        p={1}>
        <Chip
          clickable
          icon={<SelectAll />}
          label="All networks"
          sx={{ backgroundColor: 'inherit' }}></Chip>
        <Chip
          clickable
          icon={<Avatar src="/networks/OP Mainnet.png" sx={{ width: 20, height: 20 }} />}
          label="Optimism"
          sx={{ backgroundColor: 'inherit' }}></Chip>
        <Chip
          clickable
          icon={<Avatar src="/networks/Base.png" sx={{ width: 20, height: 20 }} />}
          label="Base"
          sx={{ backgroundColor: 'inherit' }}></Chip>
        <Chip
          clickable
          icon={<Avatar src="/networks/zkSync Era Testnet.png" sx={{ width: 20, height: 20 }} />}
          label="ZkSync"
          sx={{ backgroundColor: 'inherit' }}></Chip>
        <Chip
          clickable
          icon={<Avatar src="/networks/Zora Goerli Testnet.png" sx={{ width: 20, height: 20 }} />}
          label="Zora"
          sx={{ backgroundColor: 'inherit' }}></Chip>
      </Stack>
      <Box display="flex" flexDirection="column"></Box>
    </>
  );
}
