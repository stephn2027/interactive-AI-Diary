import axios from 'axios';

export const handler = async (event) => {
  // Helper function to validate incoming data

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT,DELETE',
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
      content: `You are a friendly writing assistant helping beginner writers improve their drafts. Provide clear and simple feedback on the following three areas: Coherence & Organization, Content, and Structure. Use easy-to-understand language suitable for beginners and include examples to help illustrate your suggestions.`,
    },
    {
      role: 'user',
      content: `
      I need help improving my writing. Please review my draft based on the categories below and provide simple, easy-to-understand feedback. For each category, include one or two actionable steps along with examples to help me improve my writing.

      **User Draft:**
      "${draftText}"

      **Feedback Format (JSON):**
      {
        "feedback": {
          "Coherence & Organization": "Your feedback here with examples.",
          "Content": "Your feedback here with examples.",
          "Structure": "Your feedback here with examples."
        }
      }
      `,
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
    let aiResponse = response.data.choices[0].message.content.trim();
    if (aiResponse.startsWith('```') && aiResponse.endsWith('```')) {
      aiResponse = aiResponse.replace(/^```(?:json)?\n?|```$/g, '');
    }
    // Attempting to parse the response as JSON
    let formattedResponse;
    try {
      formattedResponse = JSON.parse(aiResponse);
      console.log('API Response:', JSON.stringify(formattedResponse, null, 2));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback: Return the raw AI response if JSON parsing fails

      formattedResponse = {
        feedback: aiResponse,
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
