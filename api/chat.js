// api/chat.js - Lit l'agent_id depuis l'URL
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lire depuis l'URL ou depuis le body
    const message = req.body.message;
    const agent_id = req.query.agent || req.body.agent_id;
    const user_id = req.query.user || req.body.user_id;
    
    if (!message || !agent_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Message et agent_id sont requis' 
      });
    }

    const VOICEFLOW_API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
    const VOICEFLOW_VERSION_ID = '68a6e2cc67f4932838663767';
    const sessionUserId = user_id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const voiceflowPayload = {
      action: {
        type: 'text',
        payload: message
      },
      config: {
        tts: false,
        stripSSML: true,
        stopAll: true,
        excludeTypes: ['block', 'debug', 'flow']
      },
      session: {
        userID: sessionUserId,
        variables: {
          agentID: agent_id
        }
      }
    };

    console.log(`Chat avec agent: ${agent_id}, message: ${message}`);

    const voiceflowResponse = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${sessionUserId}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': VOICEFLOW_API_KEY,
          'Content-Type': 'application/json',
          'versionID': VOICEFLOW_VERSION_ID
        },
        body: JSON.stringify(voiceflowPayload)
      }
    );

    if (!voiceflowResponse.ok) {
      throw new Error(`Voiceflow API error: ${voiceflowResponse.status}`);
    }

    const voiceflowResult = await voiceflowResponse.json();
    
    let responseText = '';
    if (voiceflowResult && Array.isArray(voiceflowResult)) {
      for (const item of voiceflowResult) {
        if (item.type === 'text' && item.payload && item.payload.message) {
          responseText += item.payload.message + ' ';
        }
      }
    }

    if (!responseText.trim()) {
      responseText = "Je n'ai pas bien compris votre message. Pouvez-vous reformuler ?";
    }

    return res.status(200).json({
      success: true,
      response: responseText.trim(),
      agent_name: formatAgentName(agent_id),
      agent_id: agent_id,
      user_id: sessionUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur dans chat.js:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
}

function formatAgentName(agent_id) {
  if (agent_id && agent_id.includes('-')) {
    const parts = agent_id.split('-');
    return `Semaine ${parts[0]} - Agent ${parts[1]}`;
  }
  return `Agent ${agent_id}`;
}
