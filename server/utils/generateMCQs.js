  // // utils/generateMCQs.js
  // import axios from 'axios';
  // import dotenv from 'dotenv';
  // dotenv.config();

  // // Replace with your actual environment variable names
  // const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
  // const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
  // const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
  // const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

  // export async function generateMCQs(topic, count, profileData) {
  //   const { name, education, stats, recentQuizzes } = profileData;

  //   const prompt = `
  // You are an intelligent quiz generator for a personalized learning platform called LearnX.

  // Generate "${count}" multiple-choice questions (MCQs) on the topic "${topic}" based on the following student's profile:

  // Student Name: ${name}
  // Degree: ${education?.degree || 'Not specified'}
  // Course: ${education?.course || 'Not specified'}
  // Institution: ${education?.institution || 'Not specified'}
  // Country: India
  // Role: ${education?.role || 'Student'}
  // Total Quizzes Taken: ${stats?.totalQuizzes || 0}
  // Average Score: ${stats?.averageScore || 0}%
  // Most Recent Topic Attempted: ${stats?.recentTopic || 'None'}
  // Recent Quizzes attempted: ${JSON.stringify(recentQuizzes || [])}

  // Instructions:
  // - Focus on fundamental and practical understanding suitable for a student with this background.
  // - Questions should gradually increase in difficulty.
  // - Use simple language but ensure conceptual depth.
  // - Avoid repeating previous recent topics.
  // - Add short, helpful explanations for correct answers.

  // Output the MCQs in this exact JSON format:
  // [
  //   {
  //     "question": "What is ...?",
  //     "options": [
  //       { "text": "Option A", "isCorrect": false },
  //       { "text": "Option B", "isCorrect": true },
  //       { "text": "Option C", "isCorrect": false },
  //       { "text": "Option D", "isCorrect": false }
  //     ],
  //     "explanation": "..."
  //   }
  // ]
  // `;

  //   try {
  //     const response = await axios.post(
  //       `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
  //       {
  //         messages: [{ role: 'user', content: prompt }],
  //         temperature: 0.7
  //       },
  //       {
  //         headers: {
  //           'api-key': AZURE_OPENAI_KEY,
  //           'Content-Type': 'application/json'
  //         },
  //         timeout: 30000
  //       }
  //     );

  //     const rawText = response.data.choices[0].message.content;

  //     const start = rawText.indexOf('[');
  //     const end = rawText.lastIndexOf(']');
  //     if (start === -1 || end === -1) {
  //       throw new Error('🛑 JSON array not found in the model output');
  //     }

  //     let jsonString = rawText.substring(start, end + 1);
  //     jsonString = jsonString
  //       .replace(/,\s*}/g, '}')
  //       .replace(/,\s*]/g, ']')
  //       .replace(/“|”/g, '"');

  //     return JSON.parse(jsonString);

  //   } catch (error) {
  //     console.error('❌ Error generating MCQs from Azure OpenAI:', error.response?.data || error.message);
  //     return [];
  //   }
  // }
  // export async function generateReport(responses, topic, score, total, time, timeLeft, profileData) {
  //   const { name, education, stats, recentQuizzes } = profileData;

  //   const prompt = `
  // You are an AI tutor reviewing a student's quiz submission.

  // 👤 Student Profile:
  // - Name: ${name}
  // - Degree: ${education?.degree || 'Not specified'}
  // - Course: ${education?.course || 'Not specified'}
  // - Institution: ${education?.institution || 'Not specified'}
  // - Role: ${education?.role || 'Student'}

  // 📈 Previous Stats:
  // - Total Quizzes: ${stats?.totalQuizzes || 0}
  // - Avg. Score: ${stats?.averageScore || 0}%
  // - Last Topic: ${stats?.recentTopic || 'None'}

  // 📝 Current Quiz:
  // - Topic: "${topic}"
  // - Score: ${score}/${total}
  // - Time Given: ${time} sec
  // - Time Left: ${timeLeft} sec

  // 📤 Answers:
  // ${JSON.stringify(responses, null, 2)}

  // Write a short report in plain English. Format with subtitles using emojis and be concise (8–10 lines). Include:

  // 1. 🔍 A possible reason why the student answered some questions incorrectly.
  // 2. 📊 A short performance summary (compare with average score).
  // 3. ✅ One strong area and ❌ one weak area.
  // 4. ⏱️ A brief time management comment (if timeLeft < 20% or > 80%).
  // 5. 💡 1 tip to improve weak areas.
  // 6. 🎯 End with an encouraging message.

  // not in point wise

  // Do not repeat the instructions or raw data.
  // `;

  //   try {
  //     const response = await axios.post(
  //       `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
  //       {
  //         messages: [{ role: 'user', content: prompt }],
  //         temperature: 0.7
  //       },
  //       {
  //         headers: {
  //           'api-key': AZURE_OPENAI_KEY,
  //           'Content-Type': 'application/json'
  //         },
  //         timeout: 30000
  //       }
  //     );

  //     return response.data.choices[0].message.content;

  //   } catch (error) {
  //     console.error('❌ Error generating report from Azure OpenAI:', error.response?.data || error.message);
  //     return '⚠️ Failed to generate personalized report.';
  //   }
  // }
// utils/generateMCQs.js// server/utils/generateMCQs.js
// server/utils/generateMCQs.js
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
  console.log(`⚡ API key detected. Routing to ${apiKey.startsWith('gsk_') ? 'Groq' : 'xAI'} using model: ${model}`);

  let retries = 3;
  let delay = 2000;

  while (retries > 0) {
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

    if (response.status === 429) {
      retries--;
      if (retries === 0) {
        const errorData = await response.text();
        throw new Error(`AI API error (${response.status}): ${errorData}`);
      }
      console.warn(`⚠️ Rate limited (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`AI API error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export async function generateMCQs(topic, count, profileData,difficulty = 'easy') {
  const { name, education, stats, recentQuizzes } = profileData;

  const systemMsg = `You are a factually rigorous quiz generator. You MUST follow these absolute rules:
1. ACCURACY IS NON-NEGOTIABLE: Every question, every correct answer, and every explanation MUST be 100% factually correct and verifiable.
2. NEVER fabricate facts, statistics, dates, names, formulas, or definitions. If you are not certain about a fact, do NOT include it.
3. ONLY ONE correct answer per question. The correct answer must be indisputably right — not "mostly right" or "arguably right".
4. Every wrong option must be definitively wrong — not ambiguous or debatable.
5. SELF-VERIFY: Before outputting, mentally verify each correct answer. Ask yourself: "Is this provably true?" If there is any doubt, replace the question.
6. Output ONLY valid JSON — no markdown, no extra text.`;

  const prompt = `
Generate exactly "${count}" multiple-choice questions (MCQs) on the topic "${topic}".
Difficulty: ${difficulty} (scale: introductory → basic → intermediate → advanced → expert)

Student context:
- Name: ${name}
- Degree: ${education?.degree || 'Not specified'}, Course: ${education?.course || 'Not specified'}
- Institution: ${education?.institution || 'Not specified'}, Role: ${education?.role || 'Student'}
- Quizzes taken: ${stats?.totalQuizzes || 0}, Avg score: ${stats?.averageScore || 0}%
- Recent topics: ${JSON.stringify(recentQuizzes?.map(q => q.topic) || [])}

━━━ FACTUAL ACCURACY (HIGHEST PRIORITY) ━━━
1. Every correct answer MUST be an established, well-known fact — not an opinion, approximation, or AI-generated "fact".
2. Do NOT generate questions about obscure trivia that could be wrong. Stick to textbook-level, universally accepted knowledge.
3. For numerical answers (dates, values, counts), double-check the exact number before marking it correct.
4. For code-related questions, mentally trace the execution to verify the output.
5. If a question could have multiple valid interpretations, rewrite it to be unambiguous.

━━━ DISTRACTOR RULES ━━━
1. Every wrong option MUST be a specific exact value/statement — NEVER vague (e.g., NOT "a larger number" or "a different approach").
2. Design each distractor to exploit a REAL common misconception or confusion point:
   - Off-by-one or boundary errors (e.g., O(n) vs O(n-1))
   - Swapped terminology (e.g., stack vs queue)
   - Plausible-but-wrong formulas/values
   - Correct concept applied to wrong context
3. A student who has partial knowledge should find at least 2 options tempting.
4. Never use "None of the above" or "All of the above".

━━━ EXPLANATION RULES ━━━
- The explanation must: (a) state exactly why the correct answer is right with a clear factual basis, AND (b) briefly debunk at least one specific wrong option by name.

JSON format:
[
  {
    "question": "...",
    "options": [
      { "text": "Exact option A", "isCorrect": false },
      { "text": "Exact option B", "isCorrect": true },
      { "text": "Exact option C", "isCorrect": false },
      { "text": "Exact option D", "isCorrect": false }
    ],
    "explanation": "[Correct answer] is right because [reason]. [Specific wrong option] is incorrect because [debunk]."
  }
]
`;

  try {
    const text = await callGrok([
      { role: 'system', content: systemMsg },
      { role: 'user', content: prompt }
    ]);

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error("Grok Raw Output:", text);
      throw new Error('🛑 JSON array not found in the model output');
    }

    let jsonString = text.substring(start, end + 1);
    jsonString = jsonString
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/“|”/g, '"');

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Grok Raw Output:", text);
      console.error("Grok Trimmed JSON String:", jsonString);
      throw parseError;
    }
  } catch (error) {
    console.error('❌ Error generating MCQs from Grok:', error);
    return [];
  }
}

export async function generateReport(responses, topic, score, total, time, timeLeft, profileData) {
  const { name, education, stats } = profileData;

  const prompt = `
You are an AI tutor reviewing a student's quiz submission.

👤 Student Profile:
- Name: ${name}
- Degree: ${education?.degree || 'Not specified'}
- Course: ${education?.course || 'Not specified'}
- Institution: ${education?.institution || 'Not specified'}
- Role: ${education?.role || 'Student'}

📈 Previous Stats:
- Total Quizzes: ${stats?.totalQuizzes || 0}
- Avg. Score: ${stats?.averageScore || 0}%
- Last Topic: ${stats?.recentTopic || 'None'}

📝 Current Quiz:
- Topic: "${topic}"
- Score: ${score}/${total}
- Time Given: ${time} sec
- Time Left: ${timeLeft} sec

📤 Answers:
${JSON.stringify(responses, null, 2)}

Write a short report in plain English. Format with subtitles using emojis and be concise (8–10 lines). Include:

1. 🔍 A possible reason why the student answered some questions incorrectly.
2. 📊 A short performance summary (compare with average score).
3. ✅ One strong area and ❌ one weak area.
4. ⏱️ A brief time management comment (if timeLeft < 20% or > 80%).
5. 💡 1 tip to improve weak areas.
6. 🎯 End with an encouraging message.

Do not repeat the instructions or raw data.
`;

  try {
    return await callGrok([{ role: 'user', content: prompt }]);
  } catch (error) {
    console.error('❌ Error generating report from Grok:', error.message);
    return '⚠️ Failed to generate personalized report.';
  }
}


function fmt(val, fallback = 'Not specified') {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string' && val.trim() === '') return fallback;
  return val;
}

function summarizeResponses(responses = [], limit = 8) {
  const safe = Array.isArray(responses) ? responses : [];
  const total = safe.length;
  const incorrect = safe.filter(r => !r?.isCorrect);
  const correct = safe.filter(r => r?.isCorrect);

  const pick = safe.slice(0, limit).map((r, i) => {
    const q = (r?.question || '').replace(/\s+/g, ' ').trim();
    const sel = fmt(r?.selectedOption, '—');
    const cor = fmt(r?.correctOption, '—');
    const exp = fmt(r?.explanation, '—');
    return `Q${i + 1}: ${q}
- Selected: ${sel}
- Correct: ${cor}
- Correct? ${r?.isCorrect ? '✅' : '❌'}
- Explanation: ${exp}`;
  }).join('\n\n');

  return {
    total,
    correctCount: correct.length,
    incorrectCount: incorrect.length,
    sampleBlock: pick
  };
}

function lastUserMessage(messages = []) {
  const m = Array.isArray(messages) ? messages : [];
  for (let i = m.length - 1; i >= 0; i--) {
    if (m[i]?.role === 'user' && m[i]?.content) return m[i].content;
  }
  return '';
}

function compactConversation(messages = [], limit = 8) {
  const m = Array.isArray(messages) ? messages : [];
  const tail = m.slice(-limit);
  return tail.map(msg => {
    const who = msg.role === 'user' ? '🧑 User' : '🤖 AI';
    const text = (msg.content || '').toString().trim();
    return `${who}: ${text}`;
  }).join('\n');
}

export async function generateDoubtChatResponse(messages = [], userMcqs = {}) {
  // Extract & sanitize user context
  const profile = userMcqs?.profileData || {};
  const stats = profile?.stats || userMcqs?.stats || {};
  const name = fmt(profile?.name, 'Student');
  const degree = fmt(profile?.education?.degree);
  const course = fmt(profile?.education?.course);
  const institution = fmt(profile?.education?.institution);
  const role = fmt(profile?.education?.role || profile?.role || 'Student');

  const topic = fmt(userMcqs?.topic, '');
  const score = Number.isFinite(userMcqs?.score) ? userMcqs.score : undefined;
  const total = Number.isFinite(userMcqs?.total) ? userMcqs.total : undefined;
  const time = Number.isFinite(userMcqs?.time) ? userMcqs.time : undefined;
  const timeLeft = Number.isFinite(userMcqs?.timeLeft) ? userMcqs.timeLeft : undefined;

  const { sampleBlock, correctCount, incorrectCount, total: answered } =
    summarizeResponses(userMcqs?.responses, 8);

  const conv = compactConversation(messages, 10);
  const userLast = lastUserMessage(messages);

  // Build a rich, structured prompt
  const prompt = `
You are a helpful, respectful AI tutor for LearnX. Analyze the student's full context and respond appropriately.

=== STUDENT PROFILE ===
Name: ${name}
Role: ${role}
Degree: ${degree}
Course: ${course}
Institution: ${institution}

=== PAST PERFORMANCE (if available) ===
Total Quizzes: ${fmt(stats?.totalQuizzes, 'Unknown')}
Average Score: ${fmt(stats?.averageScore, 'Unknown')}%
Recent Topic: ${fmt(stats?.recentTopic, 'Unknown')}

=== CURRENT QUIZ (if available) ===
Topic: ${fmt(topic, '—')}
Score: ${Number.isFinite(score) && Number.isFinite(total) ? `${score}/${total}` : '—'}
Time Given: ${fmt(time, '—')} sec
Time Left: ${fmt(timeLeft, '—')} sec
Answered: ${answered ?? 0}, Correct: ${correctCount ?? 0}, Incorrect: ${incorrectCount ?? 0}

=== SAMPLE OF RESPONSES (truncated) ===
${sampleBlock || '—'}

=== CONVERSATION (truncated) ===
${conv}

=== TASK ===
1) You can answer ANY subject or topic the student asks, not just quiz questions. Use your general knowledge to teach clearly.
2) IF the question relates to the quiz/topic or their performance, personalize using the data above (responses, score, explanations, timing).
3) If the user asks “what is my name?”, answer with "${name}".
4) If information is missing, acknowledge the gap briefly rather than guessing.
5) Keep responses concise. Prefer:
   - TL;DR (one line)
   - Key ideas (bullets)
   - Tiny example (code/math if relevant)
   - Common mistakes
   - 1–2 quick practice tasks or next steps
6) If the question is ambiguous, ask a brief clarifying question first.

=== USER'S LATEST MESSAGE ===
"${userLast}"
`;

  try {
    return await callGrok([{ role: 'user', content: prompt }]);
  } catch (error) {
    console.error('❌ Error generating doubt chat response:', error.message);
    return '⚠️ Sorry, I could not process your question right now.';
  }
}

export async function generateGroupMCQs(topic, count, difficulty = 'intermediate') {
  const difficultyDesc = {
    introductory: 'very basic recall and recognition questions suitable for beginners',
    basic: 'fundamental concept questions with one clear correct answer',
    intermediate: 'application and analysis questions requiring deeper understanding',
    advanced: 'complex scenario-based questions with subtle distinctions between options',
    expert: 'highly challenging questions involving edge cases, exceptions, and expert-level reasoning'
  }[difficulty] || 'challenging application and analysis questions';

  const systemMsg = `You are a factually rigorous quiz generator for competitive group challenges. You MUST follow these absolute rules:
1. ACCURACY IS NON-NEGOTIABLE: Every question, every correct answer, and every explanation MUST be 100% factually correct and verifiable.
2. NEVER fabricate facts, statistics, dates, names, formulas, or definitions. If you are not certain about a fact, do NOT include it.
3. ONLY ONE correct answer per question. The correct answer must be indisputably right.
4. Every wrong option must be definitively wrong — not ambiguous or debatable.
5. SELF-VERIFY: Before outputting, mentally verify each correct answer. Ask yourself: "Is this provably true?" If there is any doubt, replace the question.
6. Output ONLY valid JSON — no markdown, no extra text.`;

  const prompt = `
Generate exactly ${count} challenging MCQs on the topic "${topic}".
Difficulty: ${difficulty} — ${difficultyDesc}

━━━ FACTUAL ACCURACY (HIGHEST PRIORITY) ━━━
1. Every correct answer MUST be an established, well-known fact — not an opinion, approximation, or AI-generated "fact".
2. Do NOT generate questions about obscure trivia that could be wrong. Stick to textbook-level, universally accepted knowledge.
3. For numerical answers (dates, values, counts), double-check the exact number before marking it correct.
4. For code-related questions, mentally trace the execution to verify the output.
5. If a question could have multiple valid interpretations, rewrite it to be unambiguous.

━━━ DISTRACTOR RULES ━━━
1. Every wrong option MUST be a SPECIFIC, EXACT value/statement — never vague, never approximate.
   ✅ GOOD: "O(n log n)", "TCP port 443", "the __init__ method", "False — immutable objects CAN be dictionary keys"
   ❌ BAD: "a larger value", "a different method", "approximately correct"
2. Each distractor must exploit a genuine common mistake:
   - Swapped concepts that students commonly confuse
   - Correct value/rule from a related but different context
   - Exact wrong number from a common calculation error
   - Exception to a rule stated as the rule itself
3. At least 2 of the 3 wrong options should be tempting to a student with 40–70% knowledge.
4. Never use "None of the above" or "All of the above".

━━━ QUESTION TYPES — mix all of these ━━━
- Direct concept: "What does X return when Y?"
- Scenario-based: "Given this code/situation, what happens?"
- Exception/edge case: "Which of the following is FALSE?"
- Application: "Which approach correctly solves...?"
- Misconception trap: Questions that reveal if students confuse two similar things

━━━ EXPLANATION RULES ━━━
- Must (a) explain exactly WHY the correct answer is right with a clear factual basis, AND (b) name and debunk at least one specific distractor.

JSON format:
[
  {
    "question": "...",
    "options": [
      { "text": "Exact option A", "isCorrect": false },
      { "text": "Exact option B", "isCorrect": true },
      { "text": "Exact option C", "isCorrect": false },
      { "text": "Exact option D", "isCorrect": false }
    ],
    "explanation": "[Correct answer] because [precise reason]. '[Wrong option X]' is a common mistake because [debunk]."
  }
]
`;

  try {
    const text = await callGrok([
      { role: 'system', content: systemMsg },
      { role: 'user', content: prompt }
    ]);

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error("Group Grok Raw Output:", text);
      throw new Error('JSON array not found in model output');
    }

    let jsonString = text.substring(start, end + 1);
    jsonString = jsonString
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/"|"/g, '"');

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Group Grok Raw Output:", text);
      console.error("Group Grok Trimmed JSON String:", jsonString);
      throw parseError;
    }
  } catch (error) {
    console.error('❌ Error generating group MCQs:', error);
    return [];
  }
}
