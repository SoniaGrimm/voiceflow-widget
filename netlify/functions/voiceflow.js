exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
  const VERSION_ID = '68a6e2cc67f49328386b3767';

  try {
    const data = JSON.parse(event.body);
    const userID = data.userID;
    const action = data.action;
    
    const url = `https://general-runtime.voiceflow.com/state/user/${userID}/interact`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
        'versionID': VERSION_ID
      },
      body: JSON.stringify({ action })
    });

    const result = await response.text();
    return {
      statusCode: response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: result
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
