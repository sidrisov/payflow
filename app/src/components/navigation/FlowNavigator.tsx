import React, { useState } from 'react';
import { Paper, IconButton, Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { green } from '@mui/material/colors';
import { FlowType } from '../../types/FlowType';

interface FlowNavigatorProps {
  orderedFlows: FlowType[];
  currentIndex: number;
  onSwipe: (direction: 'LEFT' | 'RIGHT') => void;
  onOpenSelectFlow: () => void;
}

export const FlowNavigator: React.FC<FlowNavigatorProps> = ({
  orderedFlows,
  currentIndex,
  onSwipe,
  onOpenSelectFlow,
}) => {
  const [isHoveringArrow, setIsHoveringArrow] = useState(false);

  return (
    <Paper
      elevation={5}
      {...(!isHoveringArrow && { onClick: onOpenSelectFlow })}
      sx={{
        mt: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 5,
        padding: '2px',
        cursor: isHoveringArrow ? 'default' : 'pointer',
        '&:hover': {
          backgroundColor: isHoveringArrow ? 'inherit' : 'action.hover'
        },
        WebkitTapHighlightColor: 'transparent'
      }}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onSwipe('RIGHT');
        }}
        onMouseEnter={() => setIsHoveringArrow(true)}
        onMouseLeave={() => setIsHoveringArrow(false)}
        sx={{ p: 0.5 }}>
        <ChevronLeft sx={{ fontSize: 16 }} />
      </IconButton>
      <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
        {orderedFlows.map((flow, index) => (
          <Box
            key={flow.uuid}
            sx={{
              width: index === currentIndex ? 6 : 4,
              height: index === currentIndex ? 6 : 4,
              borderRadius: '50%',
              mx: 0.25,
              bgcolor: index === currentIndex ? green.A700 : 'text.disabled',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </Box>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onSwipe('LEFT');
        }}
        onMouseEnter={() => setIsHoveringArrow(true)}
        onMouseLeave={() => setIsHoveringArrow(false)}
        sx={{ p: 0.5 }}>
        <ChevronRight sx={{ fontSize: 16 }} />
      </IconButton>
    </Paper>
  );
};
