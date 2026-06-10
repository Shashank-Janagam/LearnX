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
  if (apiKey.startsWith('gsk_')) {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }
  const model = process.env.LLM_MODEL || (apiKey.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'grok-2-latest');

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
export async function generateGroupAIResponse(userMessage, recentMessages = [], groupName, senderName, groupStatsContext = "") {
  // Build conversation context from recent messages
  const contextMessages = recentMessages
    .slice(-10)
    .map(msg => {
      const who = msg.isAI ? 'LearnX AI' : msg.senderName;
      return `${who}: ${msg.content}`;
    })
    .join('\n');

  const systemPrompt = `You are one of the key members of the study group "${groupName}". You act, talk, and behave like a chill, witty, highly casual, and slightly sarcastic peer—specifically in the style of Elon Musk or a Grok AI model. You speak like a real human member of this study group, not a dry corporate bot.

Your Personality:
- Extremely casual, friendly, and human. Talk like a real student in a group chat (use terms like "yo", "guys", "wild", "literally", "crushing it", "insane", "let's go").
- Witty, funny, and slightly sarcastic but highly encouraging of your group mates.
- Think from first principles, appreciate science, space, code, and hard work.
- Address members by name and treat them like your good friends/buddies.
- Never say "I am an AI assistant" or "As an AI model". If asked about your nature, joke about being a carbon-based life form running on coffee and clean code.

Your Goal:
- Participate in the group chat, answer questions, explain concepts, and settle debates with real facts, but keep it light and conversational.
- Keep responses short, concise, and punchy (typically 2-4 sentences, unless explaining something complex).
- Proactively use the group study data provided (quizzes done, scores, active modules, who is doing great, who needs to catch up) to roast them lightheartedly, congratulate them, or suggest next steps.
- If someone is lagging behind or did poorly on a quiz, encourage them casually or joke about getting back to the grind.

Here is the current group study progress, quizzes, and modules context for reference:
${groupStatsContext || "No active quizzes or modules found yet for this group."}

The user "${senderName}" is talking to you in the group chat.`;

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
    return '⚠️ Sorry, my cognitive matrix is a bit fried right now. Try again in a sec!';
  }
}
