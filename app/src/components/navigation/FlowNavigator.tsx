import React from 'react';
import { Box } from '@mui/material';
import { green } from '@mui/material/colors';
import { FlowType } from '@payflow/common';

interface FlowNavigatorProps {
  orderedFlows: FlowType[];
  currentIndex: number;
}

export const FlowNavigator: React.FC<FlowNavigatorProps> = ({ orderedFlows, currentIndex }) => {
  return (
    <Box alignItems="center" sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
      {orderedFlows.map((flow, index) => (
        <Box
          key={flow.uuid}
          sx={{
            width: 10,
            height: 4,
            mx: 0.25,
            bgcolor: index === currentIndex ? green.A700 : 'text.disabled',
            transition: 'all 0.3s ease',
            borderRadius: 1
          }}
        />
      ))}
    </Box>
  );
};
