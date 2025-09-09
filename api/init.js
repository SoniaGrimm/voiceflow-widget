// api/init.js - Version simple : launch + variable seulement
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const agent_id = req.query.agent || req.body?.agent_id;
    const user_id = req.query.user || req.body?.user_id;
    
    if (!agent_id) {
      return res.status(400).json({ 
        success: false,
        error: 'agent_id requis dans URL (?agent=1-3)' 
      });
    }

    const VOICEFLOW_API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
    const sessionUserId = user_id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simple launch avec variable agentID - comme ça marchait avant
    const launchPayload = {
      action: { 
        type: 'launch' 
      },
      session: {
        userID: sessionUserId,
        variables: {
          agentID: agent_id
        }
      }
    };

    console.log('Launch avec agentID:', agent_id);

    const response = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${sessionUserId}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': VOICEFLOW_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(launchPayload)
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Voiceflow: ${response.status}`);
    }

    const result = await response.json();

    // Prendre toutes les réponses que Voiceflow envoie
    let fullResponse = '';
    if (result && Array.isArray(result)) {
      for (const item of result) {
        if (item.type === 'text' && item.payload && item.payload.message) {
          fullResponse += item.payload.message + ' ';
        }
      }
    }

    return res.status(200).json({
      success: true,
      user_id: sessionUserId,
      agent_id: agent_id,
      agent_name: formatAgentName(agent_id),
      welcome_message: fullResponse.trim() || `Agent ${agent_id} initialisé`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur initialisation',
      message: error.message
    });
  }
}

function formatAgentName(agent_id) {
  if (agent_id && agent_id.includes('-')) {
    const parts = agent_id.split('-');
    return `Agent Semaine ${parts[0]} - ${parts[1]}`;
  }
  return `Agent ${agent_id}`;
}
