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

const GLOBAL_DEFAULT_SPEECH_ID = 'pMsXgVXv3BLzUgSXRplE';

const speakerConfig = {
  ja: {
    speakers: {
      'Japanese': 'RBnMinrYKeccY3vaUxlZ',
    },
    defaultSpeaker: 'Japanese',
    defaultSpeechID: 'RBnMinrYKeccY3vaUxlZ',
  },
  en: {
    speakers: {
      'English': 'pMsXgVXv3BLzUgSXRplE',
    },
    defaultSpeaker: 'English',
    defaultSpeechID: 'pMsXgVXv3BLzUgSXRplE',
  },
  es: {
    speakers: {
      'Spanish': 'GwtqU7RCQKrjzJ0dGhqT',
    },
    defaultSpeaker: 'Spanish',
    defaultSpeechID: 'GwtqU7RCQKrjzJ0dGhqT',
  },
  fr: {
    speakers: {
      'French': 'aQROLel5sQbj1vuIVi6B',
    },
    defaultSpeaker: 'French',
    defaultSpeechID: 'aQROLel5sQbj1vuIVi6B',
  },
  zh: {
    speakers: {
      'Chinese': 'GgmlugwQ4LYXBbEXENWm',
    },
    defaultSpeaker: 'Chinese',
    defaultSpeechID: 'GgmlugwQ4LYXBbEXENWm',
  },
  ko: {
    speakers: {
      'Korean': 'WqVy7827vjE2r3jWvbnP',
    },
    defaultSpeaker: 'Korean',
    defaultSpeechID: 'WqVy7827vjE2r3jWvbnP',
  },
  it: {
    speakers: {
      'Italian': 'Ha21jUwaMwdgQvqNslSM',
    },
    defaultSpeaker: 'Italian',
    defaultSpeechID: 'Ha21jUwaMwdgQvqNslSM',
  },
  de: {
    speakers: {
      'German': 'uvysWDLbKpA4XvpD3GI6',
    },
    defaultSpeaker: 'German',
    defaultSpeechID: 'uvysWDLbKpA4XvpD3GI6',
  },
  
}
export const handler = async (event) => {
  const { draft,lang, uuid } = JSON.parse(event.body);

  try {
    if (
      !draft ||
      typeof draft !== 'string' ||
      !lang ||
      typeof lang !== 'string' ||
      !uuid ||
      typeof uuid !== 'string'
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing required parameters.',
        }),
      };
    }
    const langConfig = speakerConfig[lang];
    if (!langConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid language.',
        }),
      };
    }
    let speechID;
    if(langConfig){
      const languageSettings = langConfig;
      const speakers = languageSettings.speakers;
      const defaultSpeaker = languageSettings.defaultSpeaker;
      speechID = speakers[defaultSpeaker] || GLOBAL_DEFAULT_SPEECH_ID;
    }
   

    const options = {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: draft,
        model_id: 'eleven_multilingual_v2',
      }),
    };

    
    // Check if the language exists in the configuration

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${speechID}`,
      options
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate audio: ${errorText}`);
    }
    const timeStamp = new Date().getTime();
    const filePath = `draftGenerated/${uuid}/${lang}/audio-${timeStamp}.mp3`;
   
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: response.body,
      
    };

    await s3.upload(s3Params).promise();

    const publicUrl = `${BASE_URL}/${filePath}`;
    console.log(`Audio file uploaded successfully at ${publicUrl}`);

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
