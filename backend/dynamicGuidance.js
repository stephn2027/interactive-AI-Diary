import axios from 'axios';
import {v4 as uuidv4} from 'uuid'; 
// Ensure to install uuid: npm install uuid


export const handler = async (event) => {
  // Define CORS and Content-Type headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Adjust this as needed for security
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
  };

  // Parse the incoming JSON request body
  let parsedEvent;
  try {
    parsedEvent = JSON.parse(event.body);
  } catch (error) {
    console.error('Invalid JSON in request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON in request body' }),
      headers,
    };
  }

  // Determine the type of action requested
  const { action } = parsedEvent;

  if (action === 'initialize') {
    // **Handle Topic Selection and Initial Prompt Generation**
    const { topic, setting } = parsedEvent;

    // Validate required parameters
    if (!topic || !setting) {
      console.error('Missing topic or setting');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing topic or setting' }),
        headers,
      };
    }

    // Construct the prompt for OpenAI to generate the initial system message
    const prompt = `
    You are an educational writing assistant guiding beginners through writing exercises.
    Based on the following topic and setting, generate the first system message instruction.

    **Topic:** ${topic}
    **Setting:** ${setting}

    **Format:**
    \`\`\`json
    {
    "id": "${uuidv4()}",
    "role": "System",
    "content": "<instruction_content>",

    }
    \`\`\`
    `;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'o1-2024-12-17', // Ensure you have access to the GPT-4 model
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure your API key is set in environment variables
            'Content-Type': 'application/json',
          },
        }
      );

      let aiResponse = response.data.choices[0].message.content.trim();

      // Extract JSON from code block if present
      if (aiResponse.startsWith('```') && aiResponse.endsWith('```')) {
        aiResponse = aiResponse.replace(/^```(?:json)?\n?|```$/g, '');
      }

      // Attempt to parse the AI's response as JSON
      let formattedResponse;
      try {
        formattedResponse = JSON.parse(aiResponse);

        // Assign a unique ID if not present
        if (!formattedResponse.id) {
          formattedResponse.id = uuidv4();
        }

        return {
          statusCode: 200,
          body: JSON.stringify(formattedResponse),
          headers,
        };
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        console.error('AI Response:', aiResponse);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: 'Failed to parse AI response as JSON.',
          }),
          headers,
        };
      }
    } catch (error) {
      console.error(
        'Error communicating with OpenAI API:',
        error.response?.data || error.message
      );
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error generating system message.' }),
        headers,
      };
    }
  } else if (action === 'feedback') {
    // **Handle Real-Time Feedback Based on User Input**
    const { draftText } = parsedEvent;

    // Validate required parameters
    if (
      !draftText ||
      typeof draftText !== 'string' ||
      draftText.trim().length === 0
    ) {
      console.error('Draft text must be a non-empty string');
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Draft text must be a non-empty string',
        }),
        headers,
      };
    }

    // Define completion criteria
    const criteria = [
      'The draft should be at least 3 sentences long.',
      'The draft should have clear, coherent sentences that effectively communicate basic ideas.',
      'Basic sentences are grammatically correct with minimal errors.',
    ];

    // Construct the prompt for OpenAI to generate feedback
    const prompt = `
    You are an educational writing assistant providing iterative feedback to help learners improve their drafts.
    Based on the user's draft, evaluate it against the following completion criteria and provide clear and actionable feedback.

    **User Draft:**
    "${draftText}"

    **Completion Criteria:**
    ${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

    **User Input Classification Scenarios:**
    - **On-Track Input:** Completely relevant and meets criteria.
    - **Partially On-Track Input:** Minimal content but relevant.
    - **Off-Track Input:** Irrelevant content.
    - **Completely Irrelevant Input:** Completely off-topic.
    - **Very Short or Fragmented Input:** Incomplete sentences or keywords only.
    - **Empty Input:** No response.

    **Guidelines:**
    1. **Classify** the user's input into one of the above scenarios.
    2. **Provide Feedback** based on the classification:
    - **On-Track Input:** Encourage and suggest minor improvements.
    - **Partially On-Track Input:** Acknowledge effort and guide to expand.
    - **Off-Track Input:** Gently redirect to the topic.
    - **Completely Irrelevant Input:** Reiterate the task with an example.
    - **Very Short or Fragmented Input:** Encourage turning fragments into sentences.
    - **Empty Input:** Offer a starting point or example.
    3. **Use Simple Language:** Ensure feedback is easy to understand.
    4. **Include Examples:** Where applicable, provide examples to illustrate suggestions.
    5. **Determine Completion:** If all criteria are met, include a statement indicating that all criteria have been satisfied.

    **Response Format (JSON):**
    {
    "classification": "<classification_category>",
    "feedback": "<feedback_content>",
    "allCriteriaMet": <true_or_false>,
    }
    `;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'o1-2024-12-17', // Ensure you have access to the GPT-4 model
          messages: [
            {
              role: 'system',
              content: 'You are a helpful educational assistant.',
            },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let aiResponse = response.data.choices[0].message.content.trim();

      // Extract JSON from code block if present
      if (aiResponse.startsWith('```') && aiResponse.endsWith('```')) {
        aiResponse = aiResponse.replace(/^```(?:json)?\n?|```$/g, '');
      }

      // Attempt to parse the AI's response as JSON
      let formattedResponse;
      try {
        formattedResponse = JSON.parse(aiResponse);

        // Validate required fields in the response
        const { classification, feedback, allCriteriaMet } =
          formattedResponse;
        if (typeof classification !== 'string' || typeof feedback !=='string' || typeof allCriteriaMet !== 'boolean') {
          throw new Error('Missing required fields in feedback response.');
        }
        return {
          statusCode: 200,
          body: JSON.stringify(formattedResponse),
          headers,
        };
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        console.error('AI Response:', aiResponse);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: 'Failed to parse AI response as JSON.',
          }),
          headers,
        };
      }
    } catch (error) {
      console.error(
        'Error communicating with OpenAI API:',
        error.response?.data || error.message
      );
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error generating feedback.' }),
        headers,
      };
    }
  } else {
    // **Handle Unknown or Unsupported Actions**
    console.error('Invalid action specified:', action);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid action specified.' }),
      headers,
    };
  }
};
