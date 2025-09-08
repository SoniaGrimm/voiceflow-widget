// api/chat.js - COPIEZ CE CODE EXACT
export default async function handler(req, res) {
  // Configuration CORS pour Adalo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Répondre aux requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accepter seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, agent_id, user_id } = req.body;
    
    // Validation des données
    if (!message || !agent_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Message et agent_id sont requis' 
      });
    }

    // VOS DONNÉES VOICEFLOW
    const VOICEFLOW_PROJECT_ID = '68a6e2cc67f4932838663766';
    const VOICEFLOW_VERSION_ID = '68a6e2cc67f4932838663767';
    const VOICEFLOW_API_KEY = 'VF.DM.68b95b26d255357adc1f9c55.OG2nx9m7CmY7d6BP';
    
    // Générer un user_id unique si pas fourni
    const sessionUserId = user_id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Données pour l'API Voiceflow - CORRECTION ICI
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
          agentID: agent_id  // ← CORRIGÉ : agentID au lieu de agent_id
        }
      }
    };

    console.log('Envoi à Voiceflow:', { agent_id, message, sessionUserId });

    // Appel à l'API Voiceflow
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
      const errorText = await voiceflowResponse.text();
      console.error('Erreur Voiceflow:', voiceflowResponse.status, errorText);
      throw new Error(`Voiceflow API error: ${voiceflowResponse.status}`);
    }

    const voiceflowResult = await voiceflowResponse.json();
    console.log('Réponse Voiceflow:', voiceflowResult);
    
    // Extraire la réponse textuelle
    let responseText = '';
    if (voiceflowResult && Array.isArray(voiceflowResult)) {
      for (const item of voiceflowResult) {
        if (item.type === 'text' && item.payload && item.payload.message) {
          responseText += item.payload.message + ' ';
        }
      }
    }

    // Message par défaut si pas de réponse
    if (!responseText.trim()) {
      responseText = "Je n'ai pas bien compris votre message. Pouvez-vous reformuler ?";
    }

    // Formater le nom de l'agent pour l'affichage
    const agentName = formatAgentName(agent_id);

    // Réponse pour Adalo
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
      message: error.message,
      details: 'Vérifiez les logs Vercel pour plus de détails'
    });
  }
}

// Fonction utilitaire pour formater le nom de l'agent
function formatAgentName(agent_id) {
  if (agent_id && agent_id.includes('-')) {
    const parts = agent_id.split('-');
    return `Semaine ${parts[0]} - Agent ${parts[1]}`;
  }
  return `Agent ${agent_id}`;
}
