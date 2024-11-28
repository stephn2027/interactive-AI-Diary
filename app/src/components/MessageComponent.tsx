import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Message } from '../util/types';
import dayjs from 'dayjs'; 
import Avatar from '@mui/material/Avatar';

interface MessageComponentProps {
  message: Message;
  isLoading?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === 'User';
  const timestamp = dayjs(message.id).format('HH:mm');
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        my: 1,
      }}
    >
       {!isUser && (
           <Avatar alt="System" src="../assets/systemAvatar.png" sx={{ mr: 1 }} />
         )}
         {isUser && (
           <Avatar alt="User" src="../assets/userAvatar.png" sx={{ ml: 1 }} />
         )}
      <motion.div
        initial={{ opacity: 0, x: isUser ? 100 : -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: '10px 15px',
            maxWidth: '70%',
            backgroundColor: isUser ? '#DCF8C6' : '#FFFFFF',
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
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
  );
};

export default MessageComponent;
