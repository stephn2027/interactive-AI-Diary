import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface ChatDescriptionProps {
  title: string;
}

const ChatDescription: React.FC<ChatDescriptionProps> = ({ title }) => {
  return (
    <Box
      sx={{
        width: '100%',
        py: 0,
        px: 3,
        mb:2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'transparent', // blend with parent background
      }}
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'primary.main', mb: 0 }} />
      <Typography
        variant="h5"
        component="h1"
        fontWeight="bold"
        align="center"
        sx={{ mb: 1 }}
      >
        Hi, I'm your personal writing assistant.
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ maxWidth: 600 }}
      >
        I'm here to help you craft outstanding content on the topic "{title}" today.
        Let’s get started on creating something amazing!
      </Typography>
    </Box>
  );
};

export default ChatDescription;