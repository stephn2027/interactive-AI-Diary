import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import MessageComponent from './MessageComponent';
import ChatDescription from './ChatDescription';
import { Message, Conversation, Dialogue } from '../util/types';
import conversationData from '../assets/conversations/english.json'; // Adjust the path as necessary

const ChatInterface: React.FC = () => {
  // Type assertion
  const conversations: Conversation[] = conversationData as Conversation[];

  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>(conversations[0]?.id || '');

  // Ref for scrolling to bottom
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Select the current conversation
  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  // Destructure properties if conversation exists
  const { dialogue, title, setting, speaker } = selectedConversation || {};

  // Initialize the first system message on component mount and when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.dialogue.length > 0) {
      const firstSystemDialogue = selectedConversation.dialogue[0];
      const firstSystemMessage: Message = {
        id: firstSystemDialogue.id,
        role: firstSystemDialogue.role,
        content: firstSystemDialogue.content,
        hint: firstSystemDialogue.hint || null
      };
      setMessages([firstSystemMessage]);
      setCurrentDialogueIndex(0);
      setShowHint(false);
    } else {
      // Handle the case where there's no dialogue
      setMessages([]);
    }
  }, [selectedConversation]);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handler for sending a message
  const handleSendMessage = async () => {
    if (currentInput.trim() === '' || !selectedConversation) return;

    // Append user's message
    const userMessage: Message = {
      id: Date.now(),
      role: 'User',
      content: currentInput.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput('');

    // Proceed to the next system message within the same conversation
    if ((currentDialogueIndex + 1) < selectedConversation.dialogue.length) {
      setLoading(true);
      // Simulate delay for system response
      setTimeout(() => {
        const nextSystemDialogue = selectedConversation.dialogue[currentDialogueIndex + 1];
        if (nextSystemDialogue) {
          const systemMessage: Message = {
            id: nextSystemDialogue.id,
            role: nextSystemDialogue.role,
            content: nextSystemDialogue.content,
            hint: nextSystemDialogue.hint || null
          };
          setMessages((prev) => [...prev, systemMessage]);
          setCurrentDialogueIndex(currentDialogueIndex + 1);
          setShowHint(false); // Reset hint visibility for the new message
        }
        setLoading(false);
      }, 1000); // 1-second delay to mimic processing
    } else {
      // Optionally handle end of conversation
      const endMessage: Message = {
        id: Date.now(),
        role: 'System',
        content: "You've reached the end of the conversation. Thank you!",
        hint: null
      };
      setMessages((prev) => [...prev, endMessage]);
    }
  };

  // Handler for Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handler to show hints
  const handleShowHint = () => {
    setShowHint(true);
  };

  // Handler to change conversation
  const handleConversationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newConversationId = event.target.value as string;
    setSelectedConversationId(newConversationId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Description */}
      {selectedConversation && (
        <ChatDescription
          title={title || ''}
          setting={setting || ''}
          speaker={speaker || ''}
        />
      )}
      
      {/* Conversation Selector */}
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="conversation-selector-label">Select Conversation</InputLabel>
          <Select
            labelId="conversation-selector-label"
            value={selectedConversationId}
            label="Select Conversation"
            onChange={handleConversationChange}
          >
            {conversations.map((conv) => (
              <MenuItem key={conv.id} value={conv.id}>
                {conv.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* Messages Display */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          mb: 2,
        }}
      >
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
        <div ref={endOfMessagesRef} />
        {loading && (
          <MessageComponent
            message={{
              id: Date.now(),
              role: 'System',
              content: 'Typing...',
              hint: null
            }}
            isLoading={true}
          />
        )}
      </Box>
      
      {/* Show Hint Button */}
      {messages.length > 0 && messages[messages.length - 1].role === 'System' && messages[messages.length - 1].hint && !showHint && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleShowHint}
          >
            Show Hint
          </Button>
        </Box>
      )}
      
      {/* Display Hints */}
      {showHint && messages[messages.length - 1].hint && (
        <Box sx={{ mt: 2 }}>
          {messages[messages.length - 1].hint!.map((hint, index) => (
            <Typography key={index} variant="body2" color="textSecondary">
              Hint {index + 1}: {hint}
            </Typography>
          ))}
        </Box>
      )}
      
      {/* Input Field and Send Button */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={9}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSendMessage}
            disabled={loading}
          >
            Send
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatInterface;