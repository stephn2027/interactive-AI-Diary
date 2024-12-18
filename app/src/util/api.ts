import axios from 'axios';
import { FeedbackResponse } from './types';
const dev = true;
const BASE_URL = dev
  ? 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/dev'
  : 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/beta';

const SAVE_AUDIO_URL = 'https://kkunnx02n7.execute-api.ap-northeast-1.amazonaws.com/dev';

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

export const compareDraftAPI = async (initial:string|null,final:string) =>{
  try {
    console.log("Sending drafts to generate journal");
    const response = await axios.post(`${BASE_URL}/compare`,{initialDraft:initial,finalDraft:final});
    return response.data;
  } catch (error) {
    console.log("Error calling compareDraft API ", error);
    throw error;
  }
}