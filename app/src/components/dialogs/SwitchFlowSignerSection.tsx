import { Logout } from "@mui/icons-material";
import { Stack, Typography, IconButton } from "@mui/material";
import { red } from "@mui/material/colors";
import { useAccount, useConfig } from "wagmi";
import { disconnect } from "wagmi/actions";
import { FlowType } from "../../types/FlowType";
import { shortenWalletAddressLabel } from "../../utils/address";

export function SwitchFlowSignerSection({ flow }: { flow: FlowType }) {
  const { address } = useAccount();
  const wagmiConfig = useConfig();

  return (
    <Stack spacing={1} alignItems="center">
      <Typography variant="subtitle2">
        Please, connect following flow signer:{' '}
        <u>
          <b>{shortenWalletAddressLabel(flow.owner)}</b>
        </u>
        {'!'}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">
          Currently connected signer:{' '}
          <u>
            <b>{shortenWalletAddressLabel(address)}</b>
          </u>
        </Typography>
        <IconButton
          size="small"
          onClick={async () => await disconnect(wagmiConfig)}
          sx={{ color: red.A700 }}>
          <Logout />
        </IconButton>
      </Stack>
    </Stack>
  );
}
