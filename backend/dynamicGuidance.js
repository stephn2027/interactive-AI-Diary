import axios, { all } from 'axios';
import { v4 as uuidv4 } from 'uuid';
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
    const systemPrompt = `
    You are an educational writing assistant dedicated to guiding beginners through writing exercises.`;
    // Construct the prompt for OpenAI to generate the initial system message
    const userPrompt = `

    Generate the first system message instruction based on the following topic and setting.

    **Topic:** ${topic}
    **Setting:** ${setting}
    **Instructions:**
    - The draft should be at least 3 sentences long.
    - The draft should have clear, coherent sentences that effectively communicate basic ideas.

    **Format:**
    \`\`\`json
    {
    "id": "${uuidv4()}",
    "role": "System",
    "content": "<instruction_content>",

    }
    \`\`\`

    **Sample Output:**
    \`\`\`json
    {
    "id": "${uuidv4()}",
    "role": "System",
    "content": "Your task is to write a short draft describing your latest experience shopping for a computer. Include details about what you purchased, how the staff interacted with you, and how you decided on the computer you chose. Ensure your draft is at least three sentences long, using clear and coherent language to effectively share your experience.",
    }
    \`\`\`

    `;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'o1-2024-12-17', // Ensure you have access to the GPT-4 model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
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
    const { draftText, topic, setting , isFirstDraft } = parsedEvent;

    // Validate required parameters
    if (
      !draftText ||
      typeof draftText !== 'string' ||
      draftText.trim().length === 0 ||
      !topic ||
      typeof topic !== 'string' ||
      topic.trim().length === 0 ||
      !setting ||
      typeof setting !== 'string' ||
      setting.trim().length === 0 ||
      typeof isFirstDraft !== 'boolean'
    ) {
      console.error('Draft text,topic,setting must be a non-empty string and isFirstDraft must be a boolean');
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Draft text must be a non-empty string and topic,setting must be a string and isFirstDraft must be a boolean',
        }),
        headers,
      };
    }

    // Define completion criteria
    const criteria = [
      'The draft should be relevant to the specified topic.',
      'The draft should accurately reflect the given setting.',
      'The draft should be at least 3 sentences long.',
      'The draft should have clear, coherent sentences that effectively communicate basic ideas.',
      'Basic sentences are grammatically correct with minimal errors.',
    ];
    const systemPrompt = `
    You are an educational writing assistant that provides constructive, clear, and actionable feedback to help learners improve their written drafts.
    `;
    // Construct the prompt for OpenAI to generate feedback
    const userPrompt = `
    
    Based on the user's draft, evaluate it against the following completion criteria and provide clear and actionable feedback.

    **User Draft:**
    "${draftText}"
    **Topic:** ${topic}
    **Setting:** ${setting}
    **Completion Criteria:**
    ${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}
    **Ensure Relevance:** Feedback should address both the topic and setting of the draft.
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
    5. **Determine Completion:**
     ${
       isFirstDraft
         ? 'If all criteria are met, include a statement encouraging the user to revise their draft and add more details. Do not include a congratulatory message.'
         : 'If all criteria are met, include a congratulatory statement and ask if the user would like to add more detail or are ready to showcase their work. Make sure to include words in a new line like Do you want to add more details to your draft or ready to showcase your work?.'
     }
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
              content: systemPrompt,
            },
            { role: 'user', content: userPrompt },
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
        const { classification, feedback, allCriteriaMet } = formattedResponse;
        if (
          typeof classification !== 'string' ||
          typeof feedback !== 'string' ||
          typeof allCriteriaMet !== 'boolean'
        ) {
          throw new Error('Missing required fields in feedback response.');
        }
        if(isFirstDraft){
           formattedResponse.allCriteriaMet = false;            
        }
        
        // if (!isFirstDraft && allCriteriaMet) {
        //     // Append the dynamic congratulatory message if not already included
        //     const dynamicMessage = "Would you like to add a bit more detail, or are you satisfied with the results and ready to showcase your work?";
            
        //     // Check if the dynamic message is already included to prevent duplication
        //     if (!feedback.includes(dynamicMessage)) {
        //       formattedResponse.feedback += `\n\n${dynamicMessage}`;
        //     }
        //   }
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
