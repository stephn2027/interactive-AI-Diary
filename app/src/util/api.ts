import axios from 'axios';
const dev = true;
const BASE_URL = dev
  ? 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/dev'
  : 'https://grdh0lornb.execute-api.ap-northeast-1.amazonaws.com/beta';

export const getFeedback = async (feedbackData:string) => {
  try {
    console.log('Sending draft to API:', feedbackData);
    const response = await axios.post(`${BASE_URL}/feedback`, feedbackData);
    const feedbackFromApi = response.data;
    console.log('Response data from API:', feedbackFromApi);

    if (response.data) {
      return feedbackFromApi;
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
    return 'Error getting feedback';
  }
};