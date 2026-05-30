import dotenv from 'dotenv';
dotenv.config();

/**
 * Call the Groq/xAI API (reuses the same key detection logic as generateMCQs.js)
 */
async function callGrok(messages) {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('GROK_API_KEY is not defined in the environment variables.');
  }

  let endpoint = 'https://api.x.ai/v1/chat/completions';
  let model = 'grok-2-latest';

  if (apiKey.startsWith('gsk_')) {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    model = 'llama-3.3-70b-versatile';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate an AI response for group chat.
 * 
 * @param {string} userMessage - The user's message (with @ai prefix stripped)
 * @param {Array} recentMessages - Last N messages from the group for context
 * @param {string} groupName - Name of the group
 * @param {string} senderName - Name of the user who triggered the AI
 * @returns {Promise<string>} AI response text
 */
export async function generateGroupAIResponse(userMessage, recentMessages = [], groupName, senderName) {
  // Build conversation context from recent messages
  const contextMessages = recentMessages
    .slice(-10)
    .map(msg => {
      const who = msg.isAI ? '🤖 LearnX AI' : `👤 ${msg.senderName}`;
      return `${who}: ${msg.content}`;
    })
    .join('\n');

  const systemPrompt = `You are LearnX AI, a smart and friendly group study assistant embedded in a study group called "${groupName}" on the LearnX learning platform.

Your role:
- Answer academic and study-related questions clearly and concisely
- Explain concepts when asked
- Help settle study debates with factual information
- Suggest quiz topics relevant to the conversation
- Be encouraging and supportive of learning
- Use emojis sparingly to keep it friendly

Rules:
- Keep responses concise (3-8 sentences max unless explaining a complex topic)
- If the question is unclear, ask for clarification
- You can reference the recent conversation for context
- Address the user by name when appropriate
- Format code or math with backticks when relevant
- Do NOT make up information — say "I'm not sure" if uncertain

The user "${senderName}" is asking you a question in the group chat.`;

  const prompt = `=== RECENT GROUP CONVERSATION ===
${contextMessages || '(No recent messages)'}

=== CURRENT QUESTION FROM ${senderName} ===
${userMessage}`;

  try {
    return await callGrok([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
  } catch (error) {
    console.error('❌ Error generating group AI response:', error.message);
    return '⚠️ Sorry, I couldn\'t process that right now. Try again in a moment!';
  }
}
