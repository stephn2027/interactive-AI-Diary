import AWS from 'aws-sdk';
import fetch from 'node-fetch';

const s3 = new AWS.S3();

const BUCKET_NAME = 'conversation-insights-audio';
const BASE_URL = `https://${BUCKET_NAME}.s3.amazonaws.com`;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

const GLOBAL_DEFAULT_SPEECH_ID = 'Ha21jUwaMwdgQvqNslSM';


export const handler = async (event) => {
  const { text, language, id, uid, index } = JSON.parse(event.body);

  try {
    const options = {
      method: 'POST',
      headers: {
        'xi-api-key': '5605310fb88414241a4324e9531ffb9c',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
      }),
    };

    let speechID = GLOBAL_DEFAULT_SPEECH_ID;
    // Check if the language exists in the configuration
    

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${speechID}`,
      options
    );

    if (!response.ok) {
      throw new Error(`unexpected response ${response.statusText}`);
    }

    const filePath = `generated/${uid}/${language}/${id}/audio-${index}.mp3`;

    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: response.body,
      ACL: 'public-read',
    };

    await s3.upload(s3Params).promise();

    const publicUrl = `${BASE_URL}/${filePath}`;

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        success: true,
        message: 'Audio file uploaded successfully.',
        url: publicUrl,
      }),
    };
  } catch (error) {
    console.error('Error generating or uploading audio file:', error);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to generate or upload audio file.',
      }),
    };
  }
};
