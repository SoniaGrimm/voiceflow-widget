// api/init.js - Filtre le message générique
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
        error: 'agent_id est requis dans l\'URL (?agent=1-3)' 
      });
    }

    const VOICEFLOW_API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
    const sessionUserId = user_id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Initialisation agent: ${agent_id} pour user: ${sessionUserId}`);

    // Utiliser LAUNCH avec la variable agentID pour déclencher tout le flow
    const launchPayload = {
      action: { 
        type: 'launch' 
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
          agentID: agent_id  // La variable que votre flow utilise
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
        body: JSON.stringify(launchPayload)
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Voiceflow: ${response.status}`);
    }

    const result = await response.json();
    console.log('Réponse complète Voiceflow:', result);

    // Extraire TOUTES les réponses texte
    let allMessages = [];
    if (result && Array.isArray(result)) {
      for (const item of result) {
        if (item.type === 'text' && item.payload && item.payload.message) {
          allMessages.push(item.payload.message.trim());
        }
      }
    }

    console.log('Tous les messages reçus:', allMessages);

    // FILTRER : Ignorer le message générique, garder la réponse spécifique
    let specificMessage = '';
    const genericMessage = "Salut"; // Début du message générique à ignorer
    
    for (const message of allMessages) {
      // Ignorer les messages qui commencent par "Salut" (message générique)
      if (!message.startsWith(genericMessage)) {
        specificMessage = message;
        break; // Prendre le premier message spécifique
      }
    }

    // Si pas de message spécifique trouvé, prendre le dernier (après le générique)
    if (!specificMessage && allMessages.length > 1) {
      specificMessage = allMessages[allMessages.length - 1];
    }

    const welcomeMessage = specificMessage || `Agent ${agent_id} activé`;

    return res.status(200).json({
      success: true,
      user_id: sessionUserId,
      agent_id: agent_id,
      agent_name: formatAgentName(agent_id),
      welcome_message: welcomeMessage,
      debug_all_messages: allMessages, // Pour debug
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
