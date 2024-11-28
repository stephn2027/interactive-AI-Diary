import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { Message } from '../util/types';
import dayjs from 'dayjs';

// Import avatars correctly
import userAvatar from '../assets/userAvatar.png';
import systemAvatar from '../assets/systemAvatar.png';

interface MessageComponentProps {
  message: Message;
  isLoading?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  isLoading = false,
}) => {
  const isUser = message.role === 'User';
  const timestamp = dayjs(message.id).format('HH:mm');

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1, // Margin bottom for spacing between messages
      }}
    >
      {/* Inner Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          maxWidth: '80%', // Prevent the entire container from being too wide
        }}
      >
        {/* Avatar */}
        <Avatar
          alt={isUser ? 'User' : 'System'}
          src={isUser ? userAvatar : systemAvatar}
          sx={{
            width: 40,
            height: 40,
            ml: isUser ? 1 : 0, // Margin left for user messages
            mr: isUser ? 0 : 1, // Margin right for system messages
            flexShrink: 0, // Prevent avatar from shrinking
          }}
        />

        {/* Message Bubble */}
        <motion.div
          initial={{ opacity: 0, x: isUser ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: '10px 15px',
              backgroundColor: isUser ? '#DCF8C6' : '#FFFFFF',
              wordBreak: 'break-word', // Ensure long words break correctly
              whiteSpace: 'pre-wrap', // Preserve line breaks and wrap text
              borderRadius: isUser
                ? '15px 15px 0px 15px' // Top-left corner is sharp for user
                : '15px 15px 15px 0px', // Top-right corner is sharp for system
            }}
          >
            <Typography variant="body1">{message.content}</Typography>

            {/* Timestamp for User Messages */}
            {isUser && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                <Typography variant="caption" color="textSecondary">
                  {timestamp}
                </Typography>
              </Box>
            )}

            {/* Loading Indicator for System Messages */}
            {!isUser && isLoading && (
              <Typography variant="caption" color="textSecondary">
                Typing...
              </Typography>
            )}
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default MessageComponent;