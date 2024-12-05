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
  SelectChangeEvent,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/ArrowUpwardRounded'; // Arrow icon
import MessageComponent from './MessageComponent';
import ChatDescription from './ChatDescription';
import { Message, Conversation, Dialogue } from '../util/types';
import conversationData from '../assets/conversations/english.json';
import { getFeedback } from '../util/api';

const ChatInterface: React.FC = () => {
  // Type assertion
  const conversations: Conversation[] = conversationData as Conversation[];

  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [isFeedbackLoading, setFeedbackLoading] = useState<boolean>(false);

  // Ref for scrolling to bottom
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Select the current conversation
  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  );

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
        hint: firstSystemDialogue.hint || null,
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
    const userMessageContent = currentInput.trim();
    // Append user's message
    const userMessage: Message = {
      id: Date.now(),
      role: 'User',
      content: currentInput.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    if (currentDialogueIndex === 2) {
      // Start collecting after id:2
      setUserInputs((prevInputs) => [...prevInputs, userMessageContent]);
    }
    setCurrentInput('');

    // Proceed to the next system message within the same conversation
    if (currentDialogueIndex + 1 < selectedConversation.dialogue.length) {
      setLoading(true);
      // Simulate delay for system response
      setTimeout(() => {
        const nextSystemDialogue =
          selectedConversation.dialogue[currentDialogueIndex + 1];
        if (nextSystemDialogue) {
          const systemMessage: Message = {
            id: nextSystemDialogue.id,
            role: nextSystemDialogue.role,
            content: nextSystemDialogue.content,
            hint: nextSystemDialogue.hint || null,
          };
          setMessages((prev) => [...prev, systemMessage]);
          setCurrentDialogueIndex(currentDialogueIndex + 1);
          setShowHint(false); // Reset hint visibility for the new message
          if (currentDialogueIndex + 1 === 3 && userInputs.length > 0) {
           handleFeedback(userInputs);
          }
        }
        setLoading(false);
      }, 1000); // 1-second delay to mimic processing
    } else {
      // Optionally handle end of conversation
      const endMessage: Message = {
        id: Date.now(),
        role: 'System',
        content: "You've reached the end of the conversation. Thank you!",
        hint: null,
      };
      setMessages((prev) => [...prev, endMessage]);
      if (userInputs.length > 0) {
        await handleFeedback(userInputs);
      }
    }
  };

  const handleFeedback = async (inputs: string[]) => {
    setFeedbackLoading(true);

    // Combine user inputs into a single draftText
    const draftText = inputs.join(' ');

    try {
      const feedback = await getFeedback(draftText);

      // Assuming feedback contains 'generalFeedback' and 'detailedCorrections'
      if (typeof feedback === 'object' && feedback !== null) {
        const { generalFeedback, detailedCorrections } = feedback;

        // Append general feedback
        if (generalFeedback) {
          const feedbackMessage: Message = {
            id: Date.now() + 1,
            role: 'System',
            content: `**General Feedback:** ${generalFeedback}`,
            hint: null,
          };
          setMessages((prev) => [...prev, feedbackMessage]);
        }

        // Append detailed corrections
        if (detailedCorrections) {
          const correctionsMessage: Message = {
            id: Date.now() + 2,
            role: 'System',
            content: `**Detailed Corrections:** ${detailedCorrections}`,
            hint: null,
          };
          setMessages((prev) => [...prev, correctionsMessage]);
        }

        // Optionally, reset user inputs after feedback
        setUserInputs([]);
      } else {
        // Handle unexpected feedback format
        const errorMessage: Message = {
          id: Date.now() + 3,
          role: 'System',
          content: 'Received unexpected feedback format from the server.',
          hint: null,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      // Handle errors during feedback retrieval
      const errorMessage: Message = {
        id: Date.now() + 4,
        role: 'System',
        content:
          'An error occurred while fetching feedback. Please try again later.',
        hint: null,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setFeedbackLoading(false);
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
  const handleConversationChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode
  ) => {
    const newConversationId = event.target.value as string;
    setSelectedConversationId(newConversationId);
    setUserInputs([]);
  };
  console.log('usermessage: ' + userInputs);
  const isInputDisabled = currentDialogueIndex === 3;
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
          <InputLabel id="conversation-selector-label">
            Select Conversation
          </InputLabel>
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
              hint: null,
            }}
            isLoading={true}
          />
        )}
      </Box>

      {/* Show Hint Button */}
      {messages.length > 0 &&
        messages[messages.length - 1].role === 'System' &&
        messages[messages.length - 1].hint &&
        !showHint && (
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
              {hint}
            </Typography>
          ))}
        </Box>
      )}

      {/* Input Field and Send Button */}
      {/* Input Field with Inline Send Button */}
      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          minRows={1}
          maxRows={6} // Auto-resize up to 6 rows
          disabled={isInputDisabled || loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  edge="end"
                  disabled={isInputDisabled || loading}
                  aria-label="send message"
                  sx={{
                    margin: '0px',
                    backgroundColor: '#1a73e8', // Blue background
                    color: '#ffffff', // White icon
                    padding: '.3rem',
                    borderRadius: '50%',
                    transition: 'background-color 0.3s, transform 0.2s',
                    '&:hover': {
                      backgroundColor: '#1669bb', // Darker blue on hover
                      transform: 'translateY(-2px)', // Slightly move up on hover
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
            // Optional: Add styles to remove borders or adjust padding
            sx: {
              backgroundColor: '#ffffff',
              borderRadius: '20px',
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
            },
            // Adjust the padding to align with ChatGPT style
            '& .MuiInputBase-input': {
              paddingRight: '60px', // Space for the icon
            },
          }}
        />
        {/* Optionally, display a message when input is disabled */}
        {isInputDisabled && (
          <Typography variant="caption" color="textSecondary" mt={1}>
            Please follow the prompts to continue the conversation.
          </Typography>
        )}
        {/* Display feedback loading indicator */}
        {isFeedbackLoading && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Fetching feedback...
            </Typography>
            <CircularProgress size={20} sx={{ ml: 1 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatInterface;
