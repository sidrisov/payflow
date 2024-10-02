import React, { useState, useEffect } from 'react';
import { Stack, IconButton, Typography, TextField, Box } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  min?: number;
  max?: number;
  decimals?: number;
  step?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  setQuantity,
  min = 1,
  max = 10,
  decimals = 0,
  step = 1 / 10 ** decimals
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toFixed(decimals));

  useEffect(() => {
    setInputValue(quantity.toFixed(decimals));
  }, [quantity, decimals]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Allow empty input
    if (value === '') {
      setInputValue(value);
      return;
    }

    if (decimals === 0) {
      if (/^[1-9]\d*$/.test(value)) {
        setInputValue(value);
      }
    } else if (new RegExp(`^([1-9]\\d*|0)(\\.\\d{0,${decimals}})?$`).test(value)) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue) || newValue < min) {
      newValue = min;
    } else if (newValue > max) {
      newValue = max;
    }
    setQuantity(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    }
  };

  const handleEditStart = () => {
    setInputValue(quantity.toFixed(decimals));
    setIsEditing(true);
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 0.5,
        height: 40
      }}>
      <IconButton
        onClick={() => setQuantity((prev) => Math.max(prev - step, min))}
        sx={{ borderRadius: 2, p: 0.5 }}>
        <Remove fontSize="small" sx={{ color: 'text.secondary' }} />
      </IconButton>
      <Box sx={{ width: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isEditing ? (
          <TextField
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
                style: {
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }
              }
            }}
            sx={{
              '& input': {
                textAlign: 'center'
              }
            }}
          />
        ) : (
          <Typography
            fontSize="1.5rem"
            fontWeight="bold"
            onClick={handleEditStart}
            sx={{ cursor: 'pointer', textAlign: 'center' }}>
            {Number(quantity).toFixed(decimals)}
          </Typography>
        )}
      </Box>
      <IconButton
        onClick={() => setQuantity((prev) => Math.min(prev + step, max))}
        sx={{ borderRadius: 2, p: 0.5 }}>
        <Add fontSize="small" sx={{ color: 'text.secondary' }} />
      </IconButton>
    </Stack>
  );
};
