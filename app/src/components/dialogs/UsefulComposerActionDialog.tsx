import React, { useState } from 'react';
import { Dialog, DialogContent, DialogProps, Tabs, Tab, Box } from '@mui/material';
import { green } from '@mui/material/colors';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { MoxieInfoCard } from '../cards/MoxieInfoCard';
import { DegenInfoCard } from '../cards/DegenInfoCard';
import { useMobile } from '../../utils/hooks/useMobile';

export type UsefulComposerActionDialogProps = DialogProps & CloseCallbackType;

export default function UsefulComposerActionDialog({
  closeStateCallback,
  ...props
}: UsefulComposerActionDialogProps) {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      onClose={closeStateCallback}
      {...props}
      PaperProps={{
        elevation: 5,
        sx: {
          ...(!isMobile && {
            width: 375,
            borderRadius: 5
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogContent>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            mb: 2, 
            '& .MuiTabs-flexContainer': {
              gap: 1,
            },
            '& .MuiTab-root': { 
              fontWeight: 'bold',
              fontSize: '1rem',
              borderRadius: '16px',
              minHeight: '48px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-selected': { 
                color: green.A700,
                fontWeight: 'bolder',
              },
            },
            '& .MuiTabs-indicator': { 
              backgroundColor: green.A700,
              height: 3,
              borderRadius: '3px',
            },
            '& .MuiTouchRipple-root': {
              borderRadius: '16px',
            },
          }}
        >
          <Tab label="Moxie" disableRipple />
          <Tab label="Degen" disableRipple />
        </Tabs>
        
        <Box>
          {activeTab === 0 && <MoxieInfoCard />}
          {activeTab === 1 && <DegenInfoCard />}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
