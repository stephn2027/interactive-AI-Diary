import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '../util/types';

interface MessageDisplayProps {
  message: Message;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  message,
}) => {
  return (
    <Box my={1}>
      <motion.div
        initial={{ opacity: 0, x: message.role === 'User' ? 100 : -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: '10px 15px',
            maxWidth: '80%',
            backgroundColor: message.role === 'User' ? '#DCF8C6' : '#FFFFFF',
            alignSelf: message.role === 'User' ? 'flex-end' : 'flex-start',
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default MessageDisplay;