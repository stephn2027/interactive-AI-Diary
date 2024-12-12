import React from 'react';
import { Box, Paper, Typography, Avatar, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { Message } from '../util/types';
import dayjs from 'dayjs';
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
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          maxWidth: '80%',
          wordBreak: 'break-word',
        }}
      >
        <Avatar
          alt={isUser ? 'User' : 'System'}
          src={isUser ? userAvatar : systemAvatar}
          sx={{
            width: 40,
            height: 40,
            ml: isUser ? 1 : 0,
            mr: isUser ? 0 : 1,
            flexShrink: 0,
          }}
        />
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
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word', // Added for better word wrapping
              borderRadius: isUser
                ? '15px 15px 0px 15px'
                : '15px 15px 15px 0px',
              overflowY: 'auto',
            }}
          >
            {/* Render Markdown Content */}
          {/* Render Feedback if available */}
          {message.feedback ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {message.feedback.title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {message.feedback.items.map((item, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {item.category}:
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
            )}
            {isUser && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                <Typography variant="caption" color="textSecondary">
                  {timestamp}
                </Typography>
              </Box>
            )}
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
