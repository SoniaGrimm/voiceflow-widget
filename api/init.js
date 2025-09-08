// api/init.js - Version qui bypasse le message générique
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
    const { agent_id, user_id } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ 
        success: false,
        error: 'agent_id est requis' 
      });
    }

    const VOICEFLOW_API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
    const sessionUserId = user_id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ÉTAPE 1: Initialiser la session silencieusement (sans launch)
    const initPayload = {
      session: {
        userID: sessionUserId,
        variables: {
          agentID: agent_id
        }
      }
    };

    const initResponse = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${sessionUserId}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': VOICEFLOW_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initPayload)
      }
    );

    // ÉTAPE 2: Envoyer un message qui déclenche les conditions directement
    const triggerPayload = {
      action: {
        type: 'text',
        payload: 'je teste le flow' // Message qui déclenche vos conditions
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

    const response = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${sessionUserId}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': VOICEFLOW_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(triggerPayload)
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur initialisation: ${response.status}`);
    }

    const result = await response.json();
    console.log('Session initialisée:', result);

    // Extraire le vrai message de l'agent spécifique
    let welcomeMessage = '';
    if (result && Array.isArray(result)) {
      for (const item of result) {
        if (item.type === 'text' && item.payload && item.payload.message) {
          welcomeMessage += item.payload.message + ' ';
        }
      }
    }

    return res.status(200).json({
      success: true,
      user_id: sessionUserId,
      agent_id: agent_id,
      agent_name: formatAgentName(agent_id),
      welcome_message: welcomeMessage.trim() || `Agent ${agent_id} activé`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur initialisation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initialisation',
      message: error.message
    });
  }
}

function formatAgentName(agent_id) {
  if (agent_id && agent_id.includes('-')) {
    const parts = agent_id.split('-');
    return `Agent de la Semaine ${parts[0]}, Numéro ${parts[1]}`;
  }
  return `Agent ${agent_id}`;
}
