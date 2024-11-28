import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface ChatDescriptionProps {
  title: string;
  setting: string;
  speaker: string;
}

const ChatDescription: React.FC<ChatDescriptionProps> = ({ title, setting, speaker }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Paper elevation={2} sx={{ padding: '10px 15px', backgroundColor: '#e3f2fd' }}>
        <Typography variant="h6" color="textPrimary">
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
           {setting}
        </Typography>
    
      </Paper>
    </Box>
  );
};

export default ChatDescription;