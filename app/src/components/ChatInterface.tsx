import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Collapse,
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
  LanguageKey,
} from '../util/types';
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
  const [postSubmissionLoading, setPostSubmissionLoading] =
    useState<boolean>(false);
  const [showPostSubmissionButtons, setShowPostSubmissionButtons] =
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
          const firstConv = fetchedConversations[0];
          setSelectedConversationId(firstConv.id);
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
    setShowPostSubmissionButtons(false);
    setUserMessageCount(0);
  };
  const selectedConv = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversationId),
    [conversations, selectedConversationId]
  );
  
  // Initialize conversation with dynamic system message
  useEffect(() => {
    const fetchInitialMessage = async () => {
      if (!selectedConversationId || messages.length > 0) return;
      const conv = conversations.find((c) => c.id === selectedConversationId);
      if (!conv) return;

      try {
        setLoading(true);
        const systemMessageData = await initializeConversation(
          conv.topic,
          conv.setting,
          selectedLanguage
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
  }, [selectedConversationId, selectedLanguage]);

  
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

  useEffect(() => {
    if (showPostSubmissionButtons || allCriteriaMet) {
      scrollToBottom();
    }
  }, [showPostSubmissionButtons, allCriteriaMet]);

  // Auto-scroll when an image is rendered
  useEffect(() => {
    if (imageURL) {
      scrollToBottom();
    }
  }, [imageURL]);

  // Optional: Auto-scroll when the journal data is displayed
  useEffect(() => {
    if (isJournalButtonClicked && journalData) {
      scrollToBottom();
    }
  }, [isJournalButtonClicked, journalData]);
  // Handler for sending a message
  const handleSendMessage = async () => {
    if (currentInput.trim() === '') return;
    const userMessageContent = currentInput.trim();
    setUserMessageCount((prev) => prev + 1);
    const currentUserMessageCount = userMessageCount + 1;
    // Append user's message
    const userMessage: Message = {
      id: Date.now(),
      role: 'User',
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, userMessage]);
    // Set the initial draft if not already set
    const isFirstDraft = currentUserMessageCount === 1;
    if (isFirstDraft) {
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
        selectedConv!.topic,
        isFirstDraft,
        selectedLanguage
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
      if (feedbackResponse.allCriteriaMet && !isFirstDraft) {
        setUserFinalDraft(userMessageContent);
        setAllCriteriaMet(true);
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
    setShowPostSubmissionButtons(true);
    scrollToBottom();
  };

  const handleReviseFinalDraft = () => {
    setUserFinalDraft(null);
    setAllCriteriaMet(false);
    setIsFinalDraftSubmitted(false);
    const reviseMessage: Message = {
      id: Date.now() + 2,
      role: 'System',
      content:
        "You've chosen to revise your draft.Please make the necessary changes.",
    };
    setMessages((prev) => [...prev, reviseMessage]);
  };

  const handleFinalSubmission = () => {
    if (userFinalDraft) {
      handleSubmitFinalDraft(userFinalDraft);
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
      const data = await generateImageAPI(userFinalDraft);
      if (data && data.success && data.imageUrl) {
        setImageURL(data.imageUrl);
      } else {
        console.error('Unable to retrieve image URL from serverless function');
      }
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
    if (!initialDraft || !userFinalDraft) {
      console.error("Cannot open diary because initial/final draft is missing.");
      return;
    }
    try {
      await initiateDraftComparison(initialDraft, userFinalDraft);
      setIsJournalButtonCliked(true);
      console.log('Open Diary button clicked');
    } catch (error) {
      console.error('Error opening diary:', error);
    }
  };

  const postSubmissionButtons =  [
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
    


  const { title } = selectedConv || {};
  const isInputDisabled = isFinalDraftSubmitted || loading;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%',maxHeight:'100vh', mb:6 }}
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}

        {/* Action Buttons after Final Draft Submission */}

        <Collapse
          in={showPostSubmissionButtons}
          timeout={{ enter: 500, exit: 300 }}
          sx={{ transition: 'height 500ms ease-in-out' }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 2,
              mb: 8,
              ml: 4,
              pb:2,
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
                sx={{
  
                  textTransform: 'none',
                  borderRadius: '20px',
                  boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {button.label}
              </Button>
            ))}
          </Box>
        </Collapse>

        <Collapse
          in={allCriteriaMet && !isFinalDraftSubmitted}
          timeout={{ enter: 500, exit: 300 }}
          sx={{ transition: 'height 500ms ease-in-out' }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 2,
              mb: 8,
              ml: 4,
              justifyContent: 'flex-start',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinalSubmission}
              startIcon={<SendIcon />}
              sx={{ textTransform: 'none', borderRadius: '20px' }}
            >
              Submit Final Draft
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleReviseFinalDraft}
              startIcon={<BookIcon />}
            >
              Revise Draft
            </Button>
          </Box>
        </Collapse>
        {/* Journal Results Displayed After Hints */}
      {isJournalButtonClicked && journalData && (
        // <JournalView journalData={journalData}/>
        <Box sx={{ mt: 10 }}>
        <JournalDataDisplay
          journalData={journalData}
          language={selectedLanguage as LanguageKey}
        />
        </Box>
      )}
      {/* Display Image */}
      {imageURL && (
        <Box
          sx={{
            mx: 'auto',
            mt: 2,
            maxWidth: '90%',
            width: { xs: '100%', sm: '80%', md: '60%' }, 
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
              sx={{ objectFit: 'contain', maxHeight: '60vh',width:'100%' }}
            />
          </Card>
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
                boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
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
