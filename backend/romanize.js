import axios from "axios";

export const handler = async (event) => {
  const { text } = JSON.parse(event.body);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  if (!text) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "text is required.",
      }),
      headers,
    };
  }

  const prompt = [
    {
      role: "system",
      content:
        "You are a highly-skilled AI model capable of romanizing text. Please romanize the following text.",
    },
    {
      role: "user",
      content: text,
    },
  ];

  try {
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        text: response.data.choices[0].message.content,
      }),
      headers,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error generating romanized text." }),
      headers,
    };
  }
};
