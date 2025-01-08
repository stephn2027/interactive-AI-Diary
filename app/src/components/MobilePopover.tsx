import React, { useState, MouseEvent } from 'react';
import { Popover, Typography } from '@mui/material';

interface HighlightableTextWithPopoverProps {
  text: string;       // The highlighted text (e.g., the content between asterisks)
  detailText: string; // The explanation or detail to show in the popover
}

const HighlightableTextWithPopover: React.FC<HighlightableTextWithPopoverProps> = ({
  text,
  detailText,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLSpanElement>) => {
    // Prevent default in case you want to avoid text selection or long-press
    event.preventDefault(); 
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'text-popover' : undefined;

  return (
    <>
      <Typography
        component="span"
        aria-describedby={id}
        onClick={handleOpen}
        sx={{
          cursor: 'pointer',
          textDecoration: 'underline',
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'inline-block',
          transition: 'transform 0.3s ease',
          borderRadius: 2,
          padding: '0.1rem 0.3rem',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        {text}
      </Typography>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        
      >
        <Typography sx={{ p: 2, maxWidth: 300, color:'ivory',backgroundColor: '#3c3c40' ,opacity:0.8,mixBlendMode:'opacity',fontSize: 14 }}>   
          {detailText || 'No explanation available'}
        </Typography>
      </Popover>
    </>
  );
};

export default HighlightableTextWithPopover;