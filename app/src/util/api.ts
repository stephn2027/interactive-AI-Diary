import axios from 'axios';
import { FeedbackResponse } from './types';
import english from '../assets/conversations/english.json';
import japanese from '../assets/conversations/japanese.json';
import { Conversation } from './types';

const dev = true;
const BASE_URL = dev
  ? 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/dev'
  : 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/beta';

// const SAVE_AUDIO_URL = 'https://kkunnx02n7.execute-api.ap-northeast-1.amazonaws.com/dev';

export const getFeedback = async (draftText:string):Promise<FeedbackResponse> => {
  try {
    console.log('Sending draft to API:', draftText);
    const response = await axios.post(`${BASE_URL}/feedback`, {draftText} );
    const feedbackFromApi:FeedbackResponse = response.data;
    console.log('Response data from API:', feedbackFromApi);

    if (response.status === 200) {
      return feedbackFromApi;
    } else {
      throw new Error('Unexpected response status');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle Axios-specific errors
      console.error('Axios error message:', error.message);
      console.error('Status code:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } else if (error instanceof Error) {
      // Handle generic errors
      console.error('Error message:', error.message);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
    throw new Error('Error getting feedback');
  }
};
/**
 * Initializes a conversation by fetching the initial system message based on the topic and setting.
 * @param topic - The conversation topic.
 * @param setting - The conversation setting.
 * @returns A promise that resolves to the initial system message.
 */
export const initializeConversation = async (topic: string, setting: string,language:string) => {
  try {
    const response = await axios.post(`${BASE_URL}/dynamicguidance`, {
      action: 'initialize',
      topic,
      setting,
      language,
    });
    if (response.status === 200) {
      return response.data; // Assuming the API returns { id, role, content }
    } else {
      throw new Error('Failed to initialize conversation');
    }
  } catch (error) {
    console.error('Error initializing conversation:', error);
    throw error;
  }
};

/**
 * Fetches feedback for a given draft using the dynamicGuidance API.
 * @param draftText - The user's draft text.
 * @returns A promise that resolves to a FeedbackResponse.
 */
export const getDynamicFeedback = async (draftText: string,topic:string,setting:string,isFirstDraft:boolean,language:string): Promise<FeedbackResponse> => {
  try {
    console.log('Sending draft to API for feedback:', draftText);
    const response = await axios.post(`${BASE_URL}/dynamicguidance`, {
      action: 'feedback',
      draftText,
      topic,
      setting,
      isFirstDraft,
      language,
    });
    if (response.status === 200) {
      return response.data as FeedbackResponse;
    } else {
      throw new Error('Unexpected response status');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error message:', error.message);
      console.error('Status code:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } else if (error instanceof Error) {
      console.error('Error message:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw new Error('Error getting dynamic feedback');
  }
};


export const generateAudio = async (
  text: string,
  language: string,
  id: string,
  uid: string,
  index: number,
) => {
  try {
    // Prepare the request payload
    const payload = {
      text: text,
      language: language,
      id: id,
      index: index,
      uid: uid,
    };

    // Send the request to the server
    const response = await axios.post(`${BASE_URL}/generateaudio`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.success) {
      return response;
    } else {
      console.error('Unexpected response format from /saveaudio endpoint.');
      return null;
    }
  } catch (error) {
    console.error('Error saving audio file:', error);
    return null;
  }
};

export const compareDraftAPI = async (initial:string|null,final:string|null) =>{
  try {
    console.log("Sending drafts to generate journal");
    const response = await axios.post(`${BASE_URL}/compare`,{initialDraft:initial,finalDraft:final});
    return response.data;
  } catch (error) {
    console.log("Error calling compareDraft API ", error);
    throw error;
  }
}

export const generateImageAPI = async (finalDraft:string) =>{
  try {
    console.log("Sending text to generate image");
    const response = await axios.post(`${BASE_URL}/generateimage`,{finalDraft:finalDraft});
    return response.data;
  } catch (error) {
    console.log("Error calling generateImage API ", error);
    throw error;
  }
}

export const getConversations = async (language: string): Promise<Conversation[]> => {
  try {
    let conversationsData: Conversation[] = [];
    if (language === 'en') {
      conversationsData = english;
    } else if (language === 'ja') {
      conversationsData = japanese;
    } else {
      throw new Error('Unsupported language selected');
    }

    // Extract only the necessary fields
    const conversations: Conversation[] = conversationsData.map(conv => ({
      id: conv.id,
      title: conv.title,
      setting: conv.setting,
      topic: conv.topic,
      speaker: conv.speaker,
    }));

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};