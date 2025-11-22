import React, { useState, useEffect } from 'react';
import { Button, Stack, Typography, Box, Divider, TextField } from '@mui/material';
import ResponsiveDialog from './ResponsiveDialog';
import { FlowType } from '@payflow/common';
import { renameFlow } from '../../services/flow';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { delay } from '../../utils/delay';

interface EditFlowDialogProps {
  open: boolean;
  onClose: () => void;
  flow: FlowType;
  totalBalance: string;
}

export const EditFlowDialog: React.FC<EditFlowDialogProps> = ({
  open,
  onClose,
  flow,
  totalBalance
}) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState(flow.title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(flow.title);
  }, [flow.title]);

  const handleTitleChange = async () => {
    setIsSubmitting(true);
    if (await renameFlow(flow.uuid, title)) {
      toast.success('Renamed! Refreshing');
      await delay(1000);
      navigate(0);
    } else {
      toast.error('Failed!');
    }
    setIsSubmitting(false);
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} width={360} height={300} title={'Edit Wallet'}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleTitleChange}
            disabled={title.trim() === '' || isSubmitting || title === flow.title}>
            Update
          </Button>
        </Box>

        <Divider />

        <Box sx={{ py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" color="text.secondary">
              Total Balance
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              ${totalBalance}
            </Typography>
          </Stack>
        </Box>
      </Box>
    </ResponsiveDialog>
  );
};
