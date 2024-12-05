import axios from 'axios';

export const handler = async (event) => {
  // Helper function to validate incoming data

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Adjust based on your CORS policy
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
  };
  
  const isValidData = (parsedEvent) => {
    const { draftText } = parsedEvent;
    return typeof draftText === 'string' && draftText.trim().length > 0;
  };

  let parsedEvent;
  try {
    parsedEvent = JSON.parse(event.body);
  } catch (error) {
    console.error('Invalid JSON in request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid JSON in request body',
      }),
      headers,
    };
  }

  

  if (!isValidData(parsedEvent)) {
    console.error('Draft text must be a non-empty string');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Draft text must be a non-empty string',
      }),
      headers,
    };
  }

  const { draftText } = parsedEvent;

  // Constructing the prompt for OpenAI API
  const prompt = [
    {
      role: 'system',
      content: `You are an expert writing teacher who provides detailed, constructive feedback and corrections to improve students' writing skills. Your feedback should be clear, supportive, and aimed at helping the student enhance their writing abilities.`,
    },
    {
      role: 'user',
      content: `
        Please provide feedback and corrections for the following draft. Ensure that your response is structured, comprehensive, and offers actionable insights.

        **User Draft:**
        "${draftText}"

        **Expected Response Format (JSON):**
        {
        "generalFeedback": "Your general feedback here.",
        "detailedCorrections": "Specific corrections and suggestions here."
        }`,
    },
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-2024-08-06', // Ensure you have access to the specified model
        messages: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure your API key is set in environment variables
          'Content-Type': 'application/json',
        },
      }
    );

    // Extracting the AI's response
    const aiResponse = response.data.choices[0].message.content.trim();

    // Attempting to parse the response as JSON
    let formattedResponse;
    try {
      formattedResponse = JSON.parse(aiResponse);
      console.log('API Response:', JSON.stringify(formattedResponse, null, 2));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback: Return the raw AI response if JSON parsing fails
      formattedResponse = {
        generalFeedback: aiResponse,
        detailedCorrections: 'Unable to parse detailed corrections.',
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(formattedResponse),
      headers,
    };
  } catch (error) {
    console.error('Error communicating with OpenAI API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error generating feedback.',
      }),
      headers,
    };
  }
};
