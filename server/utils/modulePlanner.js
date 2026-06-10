import dotenv from 'dotenv';
dotenv.config();

async function callGrok(messages) {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY is not defined in the environment variables.");
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
      messages: messages,
      model: model,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateLearningPlan(topic, profileData) {
  const prompt = `
You are an expert AI Learning Curator for LearnX.
Generate a structured, progressive learning plan on the topic "${topic}" for a student with this profile:
- Name: ${profileData.name}
- Education: ${profileData.education?.degree || 'Not specified'}, ${profileData.education?.course || 'Not specified'}
- Average Score: ${profileData.stats?.averageScore || 0}%

Instructions:
1. Divide the topic into 4 to 6 progressive subtopics/quizzes.
2. The AI must decide the unlock offset in days (unlockOffsetDays) between quizzes based on the difficulty and size of the sub-topics.
   - The first quiz (index 0) must ALWAYS have unlockOffsetDays = 0 (unlocked immediately).
   - Subscriptions should be spaced out (e.g. 1 day, 2 days, 4 days, 7 days, etc.) as subtopics get progressively harder (difficulty choice from: easy, basic, intermediate, advanced, expert).
3. Assign questionCount (e.g., 5, 8, or 10 questions) per quiz.

You must output ONLY a JSON object and nothing else. No markdown wraps, no extra text.
Exact JSON Format:
{
  "title": "Mastering [Topic Name]",
  "description": "AI-generated description summarizing the goals of this learning plan...",
  "quizzes": [
    {
      "index": 0,
      "title": "Introduction to [Subtopic]",
      "topic": "Search topic used for generating MCQs",
      "description": "What this quiz covers...",
      "difficulty": "easy",
      "questionCount": 5,
      "unlockOffsetDays": 0
    },
    {
      "index": 1,
      "title": "Deep dive into [Subtopic]",
      "topic": "Search topic used for generating MCQs",
      "description": "What this quiz covers...",
      "difficulty": "basic",
      "questionCount": 5,
      "unlockOffsetDays": 2
    }
  ]
}
`;

  try {
    const responseText = await callGrok([{ role: 'user', content: prompt }]);
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error("Invalid response format from Groq. Could not find JSON object.");
    }
    const cleanJson = responseText.substring(start, end + 1);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating learning plan:", error);
    throw error;
  }
}
