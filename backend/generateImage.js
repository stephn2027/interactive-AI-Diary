import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateImageUrl = async (prompt) => {
  try {
    const options = {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1792',
    };
    const response = await openai.images.generate(options);
    // Add error handling for specific cases
    if (!response || !response.data || !response.data[0]) {
      throw new Error('Invalid response from OpenAI API');
    }
    return response.data[0].url;
  } catch (error) {
    console.error(
      'Error in generateImageUrl: ',
      error.response ? error.response.data.error : error.message
    );
    return null;
  }
};

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const { finalDraft } = body;

    if (!finalDraft || typeof finalDraft !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid input',
          message: 'Please provide a valid input',
          success: false,
        }),
      };
    }
    const prompt = `Create a vertical (portrait) image that captures the overall mood, theme, and emotional essence described by the following text:
      "${finalDraft}"
      Do NOT include any written text in the image. Instead, use visual elements such as color, composition, and style to evoke the feeling or atmosphere implied by the text. Aim for a design that resonates strongly with the given themes or emotions, without literal words on the canvas.`;

    const imageUrl = await generateImageUrl(prompt);
    if (!imageUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to generate image',
          message: 'Failed to generate image',
          success: false,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        imageUrl,
        success: true,
      }),
    };
  } catch (error) {
    console.error('Error in handler: ', error);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Internal server error',
        success: false,
      }),
    };
  }
};
