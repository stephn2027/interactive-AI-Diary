import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
  Card,
  CardMedia,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import BookIcon from '@mui/icons-material/BookOnlineSharp';
import SendIcon from '@mui/icons-material/ArrowUpwardRounded'; // Arrow icon
import MessageComponent from './MessageComponent';
import ChatDescription from './ChatDescription';
import {
  Message,
  Conversation,
  FeedbackResponse,
  Feedback,
} from '../util/types';
import conversationData from '../assets/conversations/english.json';
import {
  compareDraftAPI,
  getFeedback,
  generateImageAPI,
  getDialogueJSON,
} from '../util/api';
import JournalDataDisplay from './JournalDataDisplay';
import LanguageSelector from './LanguageSelector';
import ConversationSelector from './ConversationSelector';

const ChatInterface: React.FC = () => {
  // State declarations
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  //chat states
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
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [userFinalDraft, setUserFinalDraft] = useState<string | null>(null);
  const [isFinalDraftSubmitted, setIsFinalDraftSubmitted] =
    useState<boolean>(false);
  // const [audioLoading, setAudioLoading] = useState<boolean>(false);
  // const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // const [audioError, setAudioError] = useState<string | null>(null);
  const [initialDraft, setInitialDraft] = useState<string | null>(null);
  const [journalData, setJournalData] = useState<string | null>(null);
  const [isJournalButtonClicked, setIsJournalButtonCliked] =
    useState<boolean>(false);
  const [hasReviseMessageShown, setHasRevisedMessageShown] =
    useState<boolean>(false);
  const [postSubmissionLoading, setPostSubmissionLoading] =
    useState<boolean>(false);
  const [imageURL, setImageURL] = useState<string | null>(null);
  // Refs
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Select the current conversation
  useEffect(() => {
    const fetchConversationData = async () => {
      // Fetch conversation data based on the selected language
      try {
        const data = await getDialogueJSON(selectedLanguage);
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error('Invalid conversation data');
          setConversations([]);
          return;
        }
        setConversations(data as Conversation[]);
        setSelectedConversationId(data[0].id);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
      }
    };
    fetchConversationData();
  }, [selectedLanguage]);
  // Reset chat state when conversation changes
  const resetChatState = () => {
    setMessages([]);
    setCurrentDialogueIndex(0);
    setShowHint(false);
    setInitialDraft(null);
    setUserFinalDraft(null);
    setIsJournalButtonCliked(false);
    setJournalData(null);
    setUserMessageCount(0);
    setHasRevisedMessageShown(false);
    setLoading(false);
    setFeedbackLoading(false);
    setPostSubmissionLoading(false);
    setImageURL(null);
    setUserInputs([]);
  };

  // Initialize the first system message on component mount and when conversation changes
  useEffect(() => {
    // We can only do setup if we have a valid conversation ID and
    // the conversations array is loaded
    if (!selectedConversationId || conversations.length === 0) {
      return;
    }
    // Find the selected conversation
    const selectedConv = conversations.find(
      (conv) => conv.id === selectedConversationId
    );
    if (!selectedConv || selectedConv.dialogue.length === 0) {
      setMessages([]);
      return;
    }

    // Initialize the chat with the first system message
    const firstSystemDialogue = selectedConv.dialogue[0];
    const firstSystemMessage: Message = {
      id: firstSystemDialogue.id,
      role: firstSystemDialogue.role,
      content: firstSystemDialogue.content,
      hint: firstSystemDialogue.hint || null,
    };
    setMessages([firstSystemMessage]);
    setCurrentDialogueIndex(0);
    setShowHint(false);
    setIsJournalButtonCliked(false);
    setJournalData(null);
    setUserMessageCount(0);
    setHasRevisedMessageShown(false);
    // userInputs etc. remain reset
  }, [selectedConversationId, conversations]);
  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    scrollToBottom();
  }, [messages]);

  // Handler for sending a message
  const handleSendMessage = async () => {
    const selectedConv = conversations.find(
      (conv) => conv.id === selectedConversationId
    );
    if (currentInput.trim() === '' || !selectedConv) return;
    const userMessageContent = currentInput.trim();
    // Append user's message
    const userMessage: Message = {
      id: Date.now(),
      role: 'User',
      content: currentInput.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const newUserMessageCount = userMessageCount + 1;
    setUserMessageCount(newUserMessageCount);
    console.log('User message count:', newUserMessageCount);

    let newInputs = userInputs;
    if (newUserMessageCount > 2 && newUserMessageCount <= 4) {
      newInputs = [...userInputs, userMessageContent];
      setUserInputs(newInputs);
      console.log('Updated userInputs:', newInputs);
    }
    setCurrentInput('');

    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (userMessageCount === 4) {
      return;
    }

    // Proceed to the next system message within the same conversation
    if (currentDialogueIndex + 1 < selectedConv.dialogue.length) {
      setLoading(true);
      // Simulate delay for system response
      setTimeout(() => {
        const nextSystemDialogue =
          selectedConv.dialogue[currentDialogueIndex + 1];
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
          if (newUserMessageCount === 3) {
            console.log('Triggering handleFeedback with:', newInputs);
            handleFeedback(newInputs);
          }
        }
        setLoading(false);
      }, 1000); // 1-second delay to mimic processing
    } else if (isFinalDraftSubmitted) {
      // Optionally handle end of conversation

      const endMessage: Message = {
        id: Date.now(),
        role: 'System',
        content: "You've reached the end of the conversation. Thank you!",
        hint: null,
      };
      setMessages((prev) => [...prev, endMessage]);

      // if (userInputs.length === 3 && !isFinalDraftSubmitted) {
      //   await handleFeedback(userInputs);
      // }
    }
  };

  const handleFeedback = async (inputs: string[]) => {
    setFeedbackLoading(true);

    // Combine user inputs into a single draftText
    const draftText = inputs.join(' ');
    setInitialDraft(draftText);
    try {
      const feedbackfromApi: FeedbackResponse = await getFeedback(draftText);

      const { feedback } = feedbackfromApi;

      if (feedback) {
        const structuredFeedback: Feedback = {
          title: 'Feedback:',
          items: [
            {
              category: 'Coherence & Organization',
              value: feedback['Coherence & Organization'],
            },
            { category: 'Content', value: feedback['Content'] },
            { category: 'Structure', value: feedback['Structure'] },
          ],
        };

        const feedbackMessage: Message = {
          id: Date.now() + 1,
          role: 'System',
          content: '',
          feedback: structuredFeedback,
          hint: null,
        };

        const reviseMessage: Message = {
          id: Date.now() + 2, // Ensure unique ID
          role: 'System',
          content: "Great! We're almost there! Just some minor changes needed.",
          hint: null,
        };

        setMessages((prev) => [...prev, feedbackMessage, reviseMessage]);
      }

      // Optionally, reset user inputs after feedback
      setUserInputs([]);
    } catch (error) {
      console.error('Error fetching feedback:', error);
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
  // const initiateAudioGeneration = async (draft: string) => {
  // setAudioLoading(true);
  // setAudioError(null);
  // try {
  //   const text = draft;
  //   const language = 'en';
  //   const id = Date.now();
  //   const uid = 12;
  //   const index = 9;
  //   const url = await generateAudio(text, language, id, uid, index);
  //   if (url) {
  //     setAudioUrl(url);
  //   } else {
  //     setAudioError('Failed to generate Audio');
  //   }
  // } catch (error) {
  //   setAudioError('An error occurred during audio generation.');
  // } finally {
  //   setAudioLoading(false);
  // }
  // };

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
  const handleConversationChange = (event: SelectChangeEvent<string>) => {
    const newConversationId = event.target.value as string;
    resetChatState();
    setSelectedConversationId(newConversationId);
  };
  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value;
    resetChatState();
    setSelectedLanguage(newLanguage);
  };

  //handler to submit final draft
  const handleSubmitFinalDraft = async () => {
    if (userMessageCount === 4) {
      const finalDraft = userInputs[userInputs.length - 1];
      if (!finalDraft) {
        console.error(
          'Final draft is undefined. Check userInputs:',
          userInputs
        );
        return;
      }
      setUserFinalDraft(finalDraft);
      setIsFinalDraftSubmitted(true);
      // initiateAudioGeneration(finalDraft);

      const submissionMessage: Message = {
        id: Date.now(),
        role: 'System',
        content:
          "Great! Let's showcase your work! Choose the output format below.",
        hint: null,
      };
      setMessages((prev) => [...prev, submissionMessage]);
    }
  };

  const handleReviseFinalDraft = () => {
    if (userMessageCount === 4) {
      setIsFinalDraftSubmitted(false);
      setUserFinalDraft(null);
      setUserMessageCount(3);
      setUserInputs((prev) => prev.slice(0, 3));
      // setMessages((prev) => prev.filter((msg) => msg.role !== 'System')); // Remove end message
      // setMessages(prev=>prev.slice(0,-1));
      if (!hasReviseMessageShown) {
        const reviseSystemMessage: Message = {
          id: Date.now() + 5, // Ensure a unique ID
          role: 'System',
          content: 'Great! Take your time to revise your draft.',
          hint: null,
        };
        setMessages((prev) => [...prev, reviseSystemMessage]);
        setHasRevisedMessageShown(true);
      }
    }
  };

  const initiateDraftComparison = async (
    initial: string | null,
    final: string | null
  ) => {
    setPostSubmissionLoading(true);
    try {
      const comparedDraftData = await compareDraftAPI(initial, final);
      console.log('Journal: ', comparedDraftData);
      const improvementData = comparedDraftData.draftImprovementData;
      setJournalData(improvementData);
      // const comparisonMessage: Message = {
      //   id: Date.now() + 7,
      //   role: 'System',
      //   content: improvementData, // Adjust based on response structure
      //   hint: null,
      // };
      // setMessages((prev) => [...prev, comparisonMessage]);
    } catch (error) {
      console.log('Error comparing drafts', error);
    } finally {
      setPostSubmissionLoading(false);
    }
  };
  // Handler for adding an image
  const handleAddImage = async () => {
    setPostSubmissionLoading(true); // Start loading
    try {
      // TODO: Implement image addition logic here
      console.log('Add Image button clicked');
      // check if userFinalDraft is empty
      if (!userFinalDraft) {
        console.log('User final draft is empty');
        return;
      }
      //call the api to generate image
      // const data = await generateImageAPI(userFinalDraft);
      // if (data && data.success && data.imageUrl) {
      //   setImageURL(data.imageUrl);
      // } else {
      //   console.error('Unable to retrieve image URL from serverless function');
      // }
    } catch (error) {
      console.error('Error adding image:', error);
      // Optionally, add error handling messages here
    } finally {
      setPostSubmissionLoading(false); // Stop loading
    }
  };

  // Handler for sending a letter
  const handleSendLetter = async () => {
    setPostSubmissionLoading(true); // Start loading
    try {
      // TODO: Implement letter sending logic here
      console.log('Send Letter button clicked');
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error sending letter:', error);
      // Optionally, add error handling messages here
    } finally {
      setPostSubmissionLoading(false); // Stop loading
    }
  };

  // Handler for opening the diary/journal
  const handleOpenDiary = async () => {
    try {
      await initiateDraftComparison(initialDraft, userFinalDraft);
      setIsJournalButtonCliked(true);
      console.log('Open Diary button clicked');
    } catch (error) {
      console.error('Error opening diary:', error);
    }
  };

  const postSubmissionButtons = [
    {
      label: 'Journal',
      icon: <BookIcon />,
      onClick: handleOpenDiary,
      disabled: isJournalButtonClicked,
    },
    {
      label: 'Image',
      icon: <ImageIcon />,
      onClick: handleAddImage, // Define this handler
    },
    {
      label: 'Story Book',
      icon: <MailOutlineIcon />,
      onClick: handleSendLetter, // Define this handler
    },
  ];
  const selectedConv = conversations.find(
    (conv) => conv.id === selectedConversationId
  );
  const { title, setting, speaker } = selectedConv || {};
  const isInputDisabled = userMessageCount === 4;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', mb: 6 }}
    >
      {/* Chat Description */}
      {selectedConv && (
        <ChatDescription
          title={title || ''}
          setting={setting || ''}
          speaker={speaker || ''}
        />
      )}

      {/* Conversation Selector */}
      <Box sx={{ display:'flex', gap:2, mb: 2 }}>
        {/* <LanguageSelector selectedLanguage={selectedLanguage} handleLanguageChange={handleLanguageChange}/> */}
        <ConversationSelector selectedConversationId={selectedConversationId} handleConversationChange={handleConversationChange} conversations={conversations}/>   
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
        {/* Action Buttons after 4th Message */}
        {userMessageCount === 4 && !isFinalDraftSubmitted && !loading && (
          <Box
            sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'flex-end' }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitFinalDraft}
            >
              Submit Final Draft
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleReviseFinalDraft}
            >
              Revise Draft
            </Button>
          </Box>
        )}
        {/* Action Buttons inside Messages Display */}
        {isFinalDraftSubmitted && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 2,
              mb: 2,
              ml: 6,
              justifyContent: 'flex-start',
            }}
          >
            {postSubmissionButtons.map((button, index) => (
              <Button
                key={index}
                variant="contained"
                color="primary"
                startIcon={button.icon}
                onClick={button.onClick}
                disabled={button.disabled || false}
              >
                {button.label}
              </Button>
            ))}
          </Box>
        )}

        <div ref={endOfMessagesRef} />
        {loading && !isJournalButtonClicked && (
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
      {(isFeedbackLoading || postSubmissionLoading) && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Fetching results...
          </Typography>
          <CircularProgress size={20} sx={{ ml: 1 }} />
        </Box>
      )}

      {/* Journal Results Displayed After Hints  */}
      {isJournalButtonClicked && journalData && (
        // <JournalView journalData={journalData}/>
        <JournalDataDisplay journalData={journalData} />
      )}

      {/* Display Image */}
      {imageURL && (
        <Box
          sx={{
            mx: 'auto',
            mt: 2,
            maxWidth: '100%',
            height: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Card>
            <CardMedia
              component="img"
              image={imageURL}
              alt="Generated Image"
              sx={{ objectFit: 'contain' }}
            />
          </Card>
        </Box>
      )}

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
      {!isFinalDraftSubmitted && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            autoFocus
            variant="outlined"
            placeholder="Type your message..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            multiline
            minRows={1}
            maxRows={6} // Auto-resize up to 6 rows
            disabled={isInputDisabled || loading}
            inputRef={inputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    edge="end"
                    tabIndex={-1}
                    disabled={
                      isInputDisabled || loading || isFinalDraftSubmitted
                    }
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

          {isFinalDraftSubmitted && userFinalDraft && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="green">
                Your final draft has been submitted.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Final Draft: {userFinalDraft}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatInterface;
