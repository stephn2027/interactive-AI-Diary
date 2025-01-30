import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  SelectChangeEvent,
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
import { Message, Conversation, FeedbackResponse } from '../util/types';
import {
  compareDraftAPI,
  getDynamicFeedback,
  generateImageAPI,
  getConversations,
  initializeConversation,
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
  const [currentInput, setCurrentInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [isFeedbackLoading, setFeedbackLoading] = useState<boolean>(false);
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
  const [postSubmissionLoading, setPostSubmissionLoading] =
    useState<boolean>(false);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [allCriteriaMet, setAllCriteriaMet] = useState<boolean>(false);
  // Refs
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Select the current conversation
  useEffect(() => {
    const fetchConversationData = async () => {
      // Fetch conversation data based on the selected language
      try {
        const fetchedConversations = await getConversations(selectedLanguage);
        setConversations(fetchedConversations);
        if (fetchedConversations.length > 0) {
          setSelectedConversationId(fetchedConversations[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      }
    };

    fetchConversationData();
  }, [selectedLanguage]);
  // Reset chat state when conversation changes
  const resetChatState = () => {
    setMessages([]);
    setInitialDraft(null);
    setUserFinalDraft(null);
    setIsJournalButtonCliked(false);
    setJournalData(null);
    setAllCriteriaMet(false);
    setLoading(false);
    setFeedbackLoading(false);
    setPostSubmissionLoading(false);
    setImageURL(null);
    setIsFinalDraftSubmitted(false);
  };
  // Initialize conversation with dynamic system message
  useEffect(() => {
    const fetchInitialMessage = async () => {
      if (!selectedConversationId) return;
      const selectedConv = conversations.find(
        (conv: Conversation) => conv.id === selectedConversationId
      );
      if (!selectedConv) return;

      try {
        setLoading(true);
        const systemMessageData = await initializeConversation(
          selectedConv.topic,
          selectedConv.setting
        );
        const systemMessage: Message = {
          id: Date.now(),
          role: 'System',
          content: systemMessageData.content,
        };
        setMessages([systemMessage]);
      } catch (error) {
        console.error('Error initializing conversation:', error);
        const errorMessage: Message = {
          id: Date.now(),
          role: 'System',
          content:
            'An error occurred while starting the conversation. Please try again later.',
        };
        setMessages([errorMessage]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialMessage();
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
    if (currentInput.trim() === '') return;
    const userMessageContent = currentInput.trim();
    // Append user's message
    const userMessage: Message = {
      id: Date.now(),
      role: 'User',
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, userMessage]);
    // Set the initial draft if not already set
    if (initialDraft === null) {
      setInitialDraft(userMessageContent);
    }

    setCurrentInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (isFinalDraftSubmitted) return;
    //Send the draft to the backend for feedback
    // if(!selectedConv){
    //   console.error('Selected conversation is undefined');
    //   return;
    // }
    try {
      setFeedbackLoading(true);
      setAllCriteriaMet(false);
      const feedbackResponse: FeedbackResponse = await getDynamicFeedback(
        userMessageContent,
        selectedConv!.setting,
        selectedConv!.topic
      );
      //append the feedback as system messages
      const feedbackMessage: Message = {
        id: Date.now() + 1,
        role: 'System',
        content: ` ${feedbackResponse.classification}\nFeedback: ${feedbackResponse.feedback}`,
      };
      setMessages((prev) => [...prev, feedbackMessage]);

      //check if all criteria are met
      console.log('all criteria met: ', feedbackResponse.allCriteriaMet);
      if (feedbackResponse.allCriteriaMet) {
        setUserFinalDraft(userMessageContent);
        setAllCriteriaMet(true);
        handleSubmitFinalDraft(userMessageContent);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      const errorMessage: Message = {
        id: Date.now() + 2,
        role: 'System',
        content:
          'An error occurred while fetching feedback. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // const handleFeedback = async (inputs: string[]) => {
  //   setFeedbackLoading(true);
  //   // Combine user inputs into a single draftText
  //   const draftText = inputs.join(' ');
  //   setInitialDraft(draftText);
  //   try {
  //     const feedbackfromApi: FeedbackResponse = await getFeedback(draftText);
  //     const { feedback } = feedbackfromApi;
  //     if (feedback) {
  //       const structuredFeedback: Feedback = {
  //         title: 'Feedback:',
  //         items: [
  //           {
  //             category: 'Coherence & Organization',
  //             value: feedback['Coherence & Organization'],
  //           },
  //           { category: 'Content', value: feedback['Content'] },
  //           { category: 'Structure', value: feedback['Structure'] },
  //         ],
  //       };
  //       const feedbackMessage: Message = {
  //         id: Date.now() + 1,
  //         role: 'System',
  //         content: '',
  //         feedback: structuredFeedback,
  //         hint: null,
  //       };
  //       const reviseMessage: Message = {
  //         id: Date.now() + 2, // Ensure unique ID
  //         role: 'System',
  //         content: "Great! We're almost there! Just some minor changes needed.",
  //         hint: null,
  //       };
  //       setMessages((prev) => [...prev, feedbackMessage, reviseMessage]);
  //     }
  //     // Optionally, reset user inputs after feedback
  //     setUserInputs([]);
  //   } catch (error) {
  //     console.error('Error fetching feedback:', error);
  //     // Handle errors during feedback retrieval
  //     const errorMessage: Message = {
  //       id: Date.now() + 4,
  //       role: 'System',
  //       content:
  //         'An error occurred while fetching feedback. Please try again later.',
  //       hint: null,
  //     };
  //     setMessages((prev) => [...prev, errorMessage]);
  //   } finally {
  //     setFeedbackLoading(false);
  //   }
  // };
  // const initiateAudioGeneration = async (draft: string) => {
  // setAudioLoading(true);
  // setAudioError(null);
  // try {
  // const text = draft;
  // const language = 'en';
  // const id = Date.now();
  // const uid = 12;
  // const index = 9;
  // const url = await generateAudio(text, language, id, uid, index);
  // if (url) {
  // setAudioUrl(url);
  // } else {
  // setAudioError('Failed to generate Audio');
  // }
  // } catch (error) {
  // setAudioError('An error occurred during audio generation.');
  // } finally {
  // setAudioLoading(false);
  // }
  // };

  // Handler for Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
  const handleSubmitFinalDraft = async (finalDraft: string) => {
    if (!finalDraft) {
      console.error('Final draft is undefinded');
      return;
    }
    setIsFinalDraftSubmitted(true);
    // const submissionMessage: Message = {
    //   id: Date.now() + 3,
    //   role: 'System',
    //   content: "You’ve reached 3 sentences—great work! Your draft meets all the criteria. Your story is clear, detailed, and grammatically correct. Let’s move to the next stage and showcase your work.",

    // }
    // setMessages((prev) => [...prev, submissionMessage]);
  };
  //automatically submit the final draft when set

  // const handleReviseFinalDraft = () => {
  //   if (userMessageCount === 4) {
  //     setIsFinalDraftSubmitted(false);
  //     setUserFinalDraft(null);
  //     setUserMessageCount(3);
  //     setUserInputs((prev) => prev.slice(0, 3));
  //     // setMessages((prev) => prev.filter((msg) => msg.role !== 'System')); // Remove end message
  //     // setMessages(prev=>prev.slice(0,-1));
  //     if (!hasReviseMessageShown) {
  //       const reviseSystemMessage: Message = {
  //         id: Date.now() + 5, // Ensure a unique ID
  //         role: 'System',
  //         content: 'Great! Take your time to revise your draft.',
  //         hint: null,
  //       };
  //       setMessages((prev) => [...prev, reviseSystemMessage]);
  //       setHasRevisedMessageShown(true);
  //     }
  //   }
  // };

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
      // id: Date.now() + 7,
      // role: 'System',
      // content: improvementData, // Adjust based on response structure
      // hint: null,
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
      // call the api to generate image
      console.log('Handle add image has been clicked');
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
  const { title } = selectedConv || {};
  const isInputDisabled = isFinalDraftSubmitted || loading;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', mb: 6 }}
    >
      {/* Chat Description */}
      {selectedConv && <ChatDescription title={title || ''} />}
      {/* Conversation Selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          handleLanguageChange={handleLanguageChange}
        />
        <ConversationSelector
          selectedConversationId={selectedConversationId}
          handleConversationChange={handleConversationChange}
          conversations={conversations}
        />
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

        {/* Action Buttons after Final Draft Submission */}
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
            }}
            isLoading={true}
          />
        )}
      </Box>
      {(isFeedbackLoading || postSubmissionLoading) && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Processing...
          </Typography>
          <CircularProgress size={20} sx={{ ml: 1 }} />
        </Box>
      )}
      {/* Journal Results Displayed After Hints */}
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
