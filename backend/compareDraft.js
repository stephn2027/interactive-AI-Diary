import axios from 'axios';

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Adjust as needed
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
  };

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    console.error('Invalid JSON in request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON in request body' }),
      headers,
    };
  }
  const { initialDraft, finalDraft } = parsedBody;
  //check to make sure initial and final draft is a non empty string
  if (
    typeof initialDraft !== 'string' ||
    initialDraft.trim().length === 0 ||
    typeof finalDraft !== 'string' ||
    finalDraft.trim().length === 0
  ) {
    console.error('Initial and Final drafts must be non-empty strings.');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Initial and Final drafts must be non-empty strings.',
      }),
      headers,
    };
  }
  const prompts = [
    {
      role: 'system',
      content: `You are a friendly AI assistant that compares two versions of a written draft. Highlight improvements in the final draft compared to the initial draft using *italics* and color formatting. Provide a brief explanation for each highlighted improvement. Use easy-to-understand language suitable for beginners.`,
    },
    {
      role: 'user',
      content: `Compare the following two drafts and highlight the improvements in the final draft. Use *italics* and color formatting for words or phrases that have been improved. For each improvement, provide a short explanation.
        
        First Draft:
        "${initialDraft}"

        Revised Draft:
        "${finalDraft}"

        Response Format Sample:
        First Draft:
        "I go to store buy laptop. Staff show two laptops. I choose big one. It very nice."

        Revised Draft with highlighted improvements:

        "First, *I went* to the store *to buy* a laptop. Then, *the staff showed me* two laptops. *I chose* the big one *because it has a bigger screen and better performance*."

        Explanations for Improvements:

        1. *I went*: The verb "went" is used instead of "go," making the sentence past tense, which is grammatically correct. This change makes the timing of the action clear and consistent.
        2. *to buy*: Adding "to buy" clarifies the purpose of the visit to the store, which makes the sentence more informative and specific.
        3. *the staff showed me*: The revised phrase clarifies the role of "the staff" and indicates interaction ("showed me"), making the sentence clearer and more descriptive.
        4. *I chose*: Changing "choose" to "chose" corrects the verb tense to past tense, matching the rest of the narrative.
        5. *because it has a bigger screen and better performance*: This addition provides a reason for the choice made, enhancing the sentence by giving the reader more detailed information about the decision.

    **Important Guidelines:**
    - **No Blank Lines:** Ensure that each explanation starts immediately after the number and dot without any blank lines or additional spaces.
    - **Consistent Numbering:** Use sequential numbering (1., 2., 3., etc.) without gaps.
    - **Asterisks for Emphasis:** Use a single asterisk '*' before and after the improved word or phrase (e.g., '*I went*').
    - **Colon Usage:** After the highlighted word or phrase, use a colon ':' followed by a space before starting the explanation.
    - **No Extra Formatting:** Do not add any additional formatting, indentation, or line breaks within the explanations.

    Please ensure that the response strictly follows the **Response Format Sample** provided above. Do not deviate from this format in any way, as it is essential for the correct parsing of the explanations.
        `,
    },
  ];
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-2024-08-06',
        messages: prompts,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
      console.log(
        'parsed API compareDraft Response:',
        JSON.stringify(formattedResponse, null, 2)
      );
    } catch (error) {
      console.error('Error parsing AI compareDraft response:', error);
      // Fallback: Return the raw AI response if JSON parsing fails

      formattedResponse = {
        draftImprovementData: aiResponse,
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(formattedResponse),
      headers,
    };
  } catch (error) {
    if (error.response) {
      // The request was made, and the server responded with a status code outside of the 2xx range
      console.error('OpenAI API responded with an error:', error.response.data);
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          message:
            error.response.data.error.message || 'Error from OpenAI API.',
        }),
        headers,
      };
    } else if (error.request) {
      // The request was made, but no response was received
      console.error('No response received from OpenAI API:', error.request);
      return {
        statusCode: 502,
        body: JSON.stringify({
          message: 'No response from OpenAI API.',
        }),
        headers,
      };
    } else {
      // Something happened in setting up the request
      console.error('Error setting up OpenAI API request:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Error setting up OpenAI API request.',
        }),
        headers,
      };
    }
  }
};
