import axios from 'axios';
import { FeedbackResponse } from './types';
const dev = true;
const BASE_URL = dev
  ? 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/dev'
  : 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/beta';


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