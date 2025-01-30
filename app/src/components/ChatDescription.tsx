import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface ChatDescriptionProps {
  title: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  background: `linear-gradient(135deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.common.white,
  boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
  borderRadius: theme.shape.borderRadius * 2,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ChatDescription: React.FC<ChatDescriptionProps> = ({ title }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <StyledPaper>
        <ChatBubbleOutlineIcon fontSize="large" />
        <Typography variant="h4" component="h1" fontWeight="bold" letterSpacing={0.5}>
          {title}
        </Typography>
      </StyledPaper>
    </Box>
  );
};

export default ChatDescription;