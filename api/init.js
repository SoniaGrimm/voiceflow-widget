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
    
    const initPayload = {
      action: { 
        type: 'launch' 
      },
      session: {
        userID: sessionUserId,
        variables: {
          agent_id: agent_id
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
        body: JSON.stringify(initPayload)
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur initialisation: ${response.status}`);
    }

    const result = await response.json();

    let welcomeMessage = '';
    if (result && Array.isArray(result)) {
      for (const item of result) {
        if (item.type === 'text' && item.payload && item.payload.message) {
          welcomeMessage += item.payload.message + ' ';
        }
      }
    }

    const agentName = agent_id && agent_id.includes('-') 
      ? `Agent de la Semaine ${agent_id.split('-')[0]}, Numéro ${agent_id.split('-')[1]}`
      : `Agent ${agent_id}`;

    return res.status(200).json({
      success: true,
      user_id: sessionUserId,
      agent_id: agent_id,
      agent_name: agentName,
      welcome_message: welcomeMessage.trim() || `Bonjour ! Je suis l'${agentName}. Comment puis-je vous aider ?`,
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
