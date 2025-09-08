export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, agent_id, user_id } = req.body;
    
    if (!message || !agent_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Message et agent_id sont requis' 
      });
    }

    const VOICEFLOW_API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
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
          agent_id: agent_id
        }
      }
    };

    const voiceflowResponse = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${sessionUserId}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': VOICEFLOW_API_KEY,
          'Content-Type': 'application/json',
          'versionID': '68a6e2cc67f4932838663767'
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

    const agentName = agent_id && agent_id.includes('-') 
      ? `Semaine ${agent_id.split('-')[0]} - Agent ${agent_id.split('-')[1]}`
      : `Agent ${agent_id}`;

    return res.status(200).json({
      success: true,
      response: responseText.trim(),
      agent_name: agentName,
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
